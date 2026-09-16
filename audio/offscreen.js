let audioCtx = null;
let sourceNode = null;
let compressorNode = null;
let gainNode = null;
let limiterNode = null;
let balanceNode = null;
let analyserNode = null;
let compressorEnabled = true;
let capturedTabId = null;
let captureStream = null;
let eqNodes = [];
const eqFrequencies = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];
const analyserData = new Uint8Array(256);
const waveformPoints = 512;
let mixerSettings = {
  eq: Array(10).fill(0),
  threshold: -12
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'capture-stream-ready') {
    startCapture(message.streamId, message.gain, message.compressor, message.tabId, message.mixer)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'stop-capture') {
    if (capturedTabId === message.tabId) {
      stopCapture();
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'get-capture-status') {
    sendResponse({ active: capturedTabId === message.tabId, level: getAudioLevel() });
    return false;
  }

  if (message.type === 'set-gain' && gainNode) {
    gainNode.gain.value = message.gain;
  }

  if (message.type === 'set-compressor') {
    compressorEnabled = message.enabled;
    rebuildChain();
  }

  if (message.type === 'set-mixer') {
    mixerSettings = { ...mixerSettings, ...message.settings };
    applyMixerSettings();
  }

  if (message.type === 'get-audio-level') {
    sendResponse({ level: getAudioLevel() });
    return false;
  }

  if (message.type === 'get-waveform') {
    sendResponse({ waveform: getWaveform() });
    return false;
  }
});

async function startCapture(streamId, initialGain, compressorOn, tabId, initialMixerSettings) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    }
  });

  captureStream = stream;
  audioCtx = new AudioContext();
  sourceNode = audioCtx.createMediaStreamSource(stream);

  compressorNode = audioCtx.createDynamicsCompressor();
  compressorNode.threshold.value = -12;
  compressorNode.knee.value = 20;
  compressorNode.ratio.value = 8;
  compressorNode.attack.value = 0.003;
  compressorNode.release.value = 0.25;

  gainNode = audioCtx.createGain();
  limiterNode = audioCtx.createDynamicsCompressor();
  limiterNode.threshold.value = -1;
  limiterNode.knee.value = 0;
  limiterNode.ratio.value = 20;
  limiterNode.attack.value = 0.001;
  limiterNode.release.value = 0.08;

  balanceNode = audioCtx.createStereoPanner();
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.35;

  gainNode.gain.value = initialGain;
  compressorEnabled = compressorOn;
  mixerSettings = normalizeMixerSettings({ ...mixerSettings, ...initialMixerSettings });
  capturedTabId = tabId;

  eqNodes = eqFrequencies.map((frequency) => {
    const node = audioCtx.createBiquadFilter();
    node.type = 'peaking';
    node.frequency.value = frequency;
    node.Q.value = 1.1;
    return node;
  });

  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      resetCaptureState();
    }, { once: true });
  });

  rebuildChain();
  applyMixerSettings();
}

function stopCapture() {
  captureStream?.getTracks().forEach((track) => track.stop());
  audioCtx?.close();
  resetCaptureState();
}

function resetCaptureState() {
  sourceNode?.disconnect();
  eqNodes.forEach((node) => node.disconnect());
  compressorNode?.disconnect();
  limiterNode?.disconnect();
  balanceNode?.disconnect();
  analyserNode?.disconnect();
  gainNode?.disconnect();
  capturedTabId = null;
  captureStream = null;
  audioCtx = null;
  sourceNode = null;
  compressorNode = null;
  limiterNode = null;
  balanceNode = null;
  analyserNode = null;
  gainNode = null;
  eqNodes = [];
}

function rebuildChain() {
  if (!sourceNode) return;

  sourceNode.disconnect();
  eqNodes.forEach((node) => node.disconnect());
  compressorNode.disconnect();
  limiterNode.disconnect();
  balanceNode.disconnect();
  analyserNode.disconnect();

  let currentNode = sourceNode;
  eqNodes.forEach((node) => {
    currentNode.connect(node);
    currentNode = node;
  });

  if (compressorEnabled) {
    currentNode.connect(compressorNode);
    currentNode = compressorNode;
  }

  currentNode.connect(limiterNode);
  limiterNode.connect(gainNode);
  gainNode.connect(balanceNode);
  balanceNode.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);
}

function normalizeMixerSettings(settings) {
  const legacyEq = [settings.bass, settings.bass, settings.bass, settings.mid, settings.mid, settings.mid, settings.treble, settings.treble, settings.treble, settings.treble];
  return {
    eq: Array.isArray(settings.eq) && settings.eq.length === 10
      ? settings.eq.map((value) => Number(value) || 0)
      : legacyEq.map((value) => Number(value) || 0),
    threshold: Number(settings.threshold) || -12,
    balance: Number(settings.balance) || 0,
    limiter: settings.limiter !== false
  };
}

function applyMixerSettings() {
  if (!eqNodes.length || !compressorNode || !limiterNode || !balanceNode) return;

  mixerSettings = normalizeMixerSettings(mixerSettings);
  eqNodes.forEach((node, index) => {
    node.gain.value = mixerSettings.eq[index];
  });
  compressorNode.threshold.value = mixerSettings.threshold;
  limiterNode.threshold.value = mixerSettings.limiter ? -1 : -100;
  balanceNode.pan.value = mixerSettings.balance;
}

function getAudioLevel() {
  if (!analyserNode) return 0;

  analyserNode.getByteTimeDomainData(analyserData);
  let peak = 0;
  for (const value of analyserData) {
    peak = Math.max(peak, Math.abs(value - 128));
  }
  return Math.min(1, peak / 128);
}

function getWaveform() {
  if (!analyserNode) return [];

  analyserNode.getByteTimeDomainData(analyserData);
  const step = analyserData.length / waveformPoints;
  return Array.from({ length: waveformPoints }, (_, index) => analyserData[Math.floor(index * step)]);
}
