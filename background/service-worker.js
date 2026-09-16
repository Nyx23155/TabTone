let creatingOffscreen = null;

async function ensureOffscreenDocument() {
  const existing = await getOffscreenContexts();

  if (existing.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'audio/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Process captured tab audio with Web Audio API'
  });

  await creatingOffscreen;
  creatingOffscreen = null;
}

async function getOffscreenContexts() {
  return chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
}

function forwardMessage(message, sendResponse, fallback) {
  chrome.runtime.sendMessage(message, (response) => {
    sendResponse(response || fallback);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (['set-gain', 'set-compressor', 'set-mixer'].includes(message.type)) {
    chrome.runtime.sendMessage(message);
    return false;
  }

  if (message.type === 'get-audio-level' || message.type === 'get-waveform') {
    const fallback = message.type === 'get-waveform'
      ? { waveform: [] }
      : { level: 0 };
    forwardMessage(message, sendResponse, fallback);
    return true;
  }

  if (message.type === 'get-capture-status') {
    (async () => {
      const contexts = await getOffscreenContexts();

      if (contexts.length === 0) {
        sendResponse({ active: false });
        return;
      }

      forwardMessage(message, sendResponse, { active: false });
    })().catch(() => sendResponse({ active: false }));

    return true;
  }

  if (message.type === 'stop-capture') {
    (async () => {
      const contexts = await getOffscreenContexts();

      if (contexts.length === 0) {
        sendResponse({ ok: true });
        return;
      }

      forwardMessage(message, sendResponse, { ok: true });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message.type !== 'start-capture') return false;

  (async () => {
    await ensureOffscreenDocument();

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: message.tabId
    });

    const captureMessage = {
      type: 'capture-stream-ready',
      streamId,
      tabId: message.tabId,
      gain: message.gain,
      compressor: message.compressor,
      mixer: message.mixer
    };

    forwardMessage(captureMessage, sendResponse, {
      ok: false,
      error: 'Could not start capture'
    });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === 'toggle-capture') {
    const contexts = await getOffscreenContexts();
    if (contexts.length > 0) {
      chrome.runtime.sendMessage({ type: 'stop-capture', tabId: tab.id });
    }
    return;
  }

  if (command !== 'gain-up' && command !== 'gain-down') return;

  const settings = await chrome.storage.local.get({ gainPercent: 100 });
  const change = command === 'gain-up' ? 10 : -10;
  const nextGain = Math.max(
    0,
    Math.min(400, settings.gainPercent + change)
  );
  await chrome.storage.local.set({ gainPercent: nextGain });
  chrome.runtime.sendMessage({ type: 'set-gain', gain: nextGain / 100 });
});
