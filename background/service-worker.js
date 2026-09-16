let creatingOffscreen = null;

async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (['set-gain', 'set-compressor', 'set-mixer'].includes(message.type)) {
    chrome.runtime.sendMessage(message);
    return false;
  }

  if (message.type === 'get-audio-level' || message.type === 'get-waveform') {
    chrome.runtime.sendMessage(message, (response) => {
      sendResponse(response || (message.type === 'get-waveform' ? { waveform: [] } : { level: 0 }));
    });
    return true;
  }

  if (message.type === 'get-capture-status') {
    (async () => {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
      });

      if (contexts.length === 0) {
        sendResponse({ active: false });
        return;
      }

      chrome.runtime.sendMessage(message, (response) => {
        sendResponse(response || { active: false });
      });
    })().catch(() => sendResponse({ active: false }));

    return true;
  }

  if (message.type === 'stop-capture') {
    (async () => {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
      });

      if (contexts.length === 0) {
        sendResponse({ ok: true });
        return;
      }

      chrome.runtime.sendMessage(message, (response) => {
        sendResponse(response || { ok: true });
      });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message.type !== 'start-capture') return false;

  (async () => {
    await ensureOffscreenDocument();

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: message.tabId
    });

    chrome.runtime.sendMessage({
      type: 'capture-stream-ready',
      streamId,
      tabId: message.tabId,
      gain: message.gain,
      compressor: message.compressor,
      mixer: message.mixer
    }, (response) => {
      sendResponse(response || { ok: false, error: 'Could not start capture' });
    });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === 'toggle-capture') {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (contexts.length > 0) {
      chrome.runtime.sendMessage({ type: 'stop-capture', tabId: tab.id });
    }
    return;
  }

  if (command !== 'gain-up' && command !== 'gain-down') return;

  const settings = await chrome.storage.local.get({ gainPercent: 100 });
  const nextGain = Math.max(0, Math.min(400, settings.gainPercent + (command === 'gain-up' ? 10 : -10)));
  await chrome.storage.local.set({ gainPercent: nextGain });
  chrome.runtime.sendMessage({ type: 'set-gain', gain: nextGain / 100 });
});
