const startBtn = document.getElementById('startBtn');
const gainSlider = document.getElementById('gainSlider');
const gainVal = document.getElementById('gainVal');
const compressorToggle = document.getElementById('compressorToggle');
const limiterToggle = document.getElementById('limiterToggle');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');
const balanceSlider = document.getElementById('balanceSlider');
const balanceVal = document.getElementById('balanceVal');
const mixerScreen = document.getElementById('mixerScreen');
const profilesScreen = document.getElementById('profilesScreen');
const premiumNote = document.getElementById('premiumNote');
const upgradeBtn = document.getElementById('upgradeBtn');
const presetSelect = document.getElementById('presetSelect');
const eqGrid = document.getElementById('eqGrid');
const waveform = document.getElementById('waveform');
const levelValue = document.getElementById('levelValue');
const currentProfile = document.getElementById('currentProfile');
const siteLabel = document.getElementById('siteLabel');
const profileSelect = document.getElementById('profileSelect');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const hotkeysToggle = document.getElementById('hotkeysToggle');
const languageSelect = document.getElementById('languageSelect');
const statusEl = document.getElementById('status');
const paidBadge = document.getElementById('paidBadge');

const frequencies = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];
const labels = ['60', '120', '250', '500', '1k', '2k', '4k', '8k', '12k', '16k'];
const presets = {
  voice: [-2, -2, -1, 2, 5, 5, 3, 2, 2, 1], 
  music: [4, 3, 2, 0, -1, 1, 3, 4, 4, 3], 
  bass: [8, 7, 5, 2, -1, -1, 1, 2, 2, 2],
  deepBass: [12, 10, 8, 3, -2, -2, -1, 0, 0, 0], 
  podcast: [-4, -2, 0, 4, 6, 5, 3, 3, 2, 1], 
  movie: [5, 4, 3, 1, 0, 2, 4, 5, 4, 3],
  gaming: [3, 2, 1, 2, 3, 4, 5, 5, 4, 3], 
  details: [-2, -1, 0, 2, 3, 4, 6, 7, 6, 5], 
  warm: [6, 5, 3, 2, 1, 0, -1, -2, -2, -2],
  night: [-5, -4, -3, 1, 2, 2, -1, -3, -4, -5], 
  custom: Array(10).fill(0)
};

let capturing = false;
let isPaidUser = false;
let currentHostname = 'current tab';
let profiles = {};
let mixerSettings = { eq: [...presets.custom], threshold: -12, balance: 0, limiter: true };
const waveformContext = waveform.getContext('2d');
let displayedWaveform = [];
const checkoutUrl = '';

function applyTranslations() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translations[language][element.dataset.i18n]
      || element.textContent;
  });

  Array.from(presetSelect.options).forEach((option) => {
    option.textContent = text('presets')[option.value] || option.textContent;
  });

  languageSelect.value = language;
  updateMixerUi();
  updateProfilesUi();
  setMixerAccess(isPaidUser);
  siteLabel.textContent = `${text('currentTab')}: ${currentHostname}`;
  updateCaptureStatus();
}

function createEqControls() {
  frequencies.forEach((frequency, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'eq-band';
    wrapper.innerHTML = `
      <label for="eq-${index}">${labels[index]}</label>
      <input id="eq-${index}" type="range" min="-12" max="12" value="0" aria-label="${frequency} Hz">
      <span id="eq-value-${index}" class="eq-value">0 ${text('db')}</span>
    `;

    eqGrid.appendChild(wrapper);

    const input = wrapper.querySelector('input');
    const valueLabel = wrapper.querySelector('.eq-value');

    input.addEventListener('input', () => {
      mixerSettings.eq[index] = Number(input.value);
      valueLabel.textContent = `${mixerSettings.eq[index]} ${text('db')}`;
      presetSelect.value = 'custom';
      saveAndApplyMixer();
    });
  });
}

function normalizeMixer(settings = {}) {
  const legacyEq = [
    settings.bass,
    settings.bass,
    settings.bass,
    settings.mid,
    settings.mid,
    settings.mid,
    settings.treble,
    settings.treble,
    settings.treble,
    settings.treble
  ];

  return {
    eq: Array.isArray(settings.eq) && settings.eq.length === 10
      ? settings.eq.map(Number)
      : legacyEq.map((value) => Number(value) || 0),
    threshold: Number.isFinite(Number(settings.threshold))
      ? Number(settings.threshold)
      : -12,
    balance: Number.isFinite(Number(settings.balance))
      ? Number(settings.balance)
      : 0,
    limiter: settings.limiter !== false
  };
}

function updateMixerUi() {
  mixerSettings = normalizeMixer(mixerSettings);
  mixerSettings.eq.forEach((value, index) => {
    const input = document.getElementById(`eq-${index}`);
    const valueLabel = document.getElementById(`eq-value-${index}`);

    if (input) input.value = value;
    if (valueLabel) valueLabel.textContent = `${value} ${text('db')}`;
  });

  thresholdSlider.value = mixerSettings.threshold;
  thresholdVal.textContent = `${mixerSettings.threshold} ${text('db')}`;
  balanceSlider.value = mixerSettings.balance;
  balanceVal.textContent = getBalanceLabel(mixerSettings.balance);
  limiterToggle.checked = mixerSettings.limiter;
}

function getBalanceLabel(balance) {
  if (balance === 0) return text('center');
  return balance < 0 ? text('left') : text('right');
}

function setMixerAccess(enabled) {
  isPaidUser = enabled;
  mixerScreen.classList.toggle('pro-locked', !enabled);
  profilesScreen.classList.toggle('pro-locked', !enabled);
  paidBadge.classList.toggle('hidden', !enabled);

  presetSelect.disabled = !enabled;
  profileSelect.disabled = !enabled;
  saveProfileBtn.disabled = !enabled;
  thresholdSlider.disabled = !enabled;
  balanceSlider.disabled = !enabled;
  limiterToggle.disabled = !enabled;
  eqGrid.querySelectorAll('input').forEach((input) => {
    input.disabled = !enabled;
  });

  premiumNote.textContent = enabled ? text('liveNote') : text('proNote'); upgradeBtn.classList.toggle('hidden', enabled);
}

function saveAndApplyMixer() {
  if (!isPaidUser) return;

  chrome.storage.local.set({ mixerSettings });
  chrome.runtime.sendMessage({ type: 'set-mixer', settings: mixerSettings });
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === `${name}Screen`);
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.screen === name);
  });
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

async function updateCaptureStatus() {
  const tab = await getCurrentTab();
  if (!tab) return;

  chrome.runtime.sendMessage({ type: 'get-capture-status', tabId: tab.id }, (response) => {
    if (chrome.runtime.lastError) return;

    capturing = response?.active === true;
    startBtn.textContent = capturing
      ? text('disableForTab')
      : text('enableForTab');
    updateMeter(response?.level || 0);
  });
}

function updateMeter(level) {
  const clamped = Math.min(1, Math.max(0, Number(level) || 0));
  const safeLevel = clamped < 0.03 ? 0 : clamped;
  levelValue.textContent = `${Math.round(safeLevel * 100)}%`;
}

function buildSpectrumTarget(samples) {
  const points = 64;
  if (!samples || !samples.length) return Array(points).fill(0);

  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i];
  const avg = sum / samples.length;
  const isTimeDomain = avg > 100 && avg < 155;

  const usefulSamplesLength = Math.floor(samples.length * 0.75);

  return Array.from({ length: points }, (_, index) => {
    const norm = index / (points - 1);
    const startRatio = Math.pow(index / points, 1.8);
    const endRatio = Math.pow((index + 1) / points, 1.8);

    const start = Math.floor(startRatio * usefulSamplesLength);
    const end = Math.max(start + 1, Math.min(usefulSamplesLength, Math.ceil(endRatio * usefulSamplesLength)));

    let peak = 0;
    for (let i = start; i < end; i++) {
      let val = samples[i];
      if (isTimeDomain) {
        val = Math.abs(val - 128) * 2;
      }
      peak = Math.max(peak, val / 255);
    }

    let edgeFade = 1;
    if (norm < 0.08) edgeFade = norm / 0.08;
    else if (norm > 0.92) edgeFade = (1 - norm) / 0.08;

    const finalVal = peak * edgeFade;
    return finalVal < 0.03 ? 0 : finalVal;
  });
}

function refreshMeter() {
  if (!capturing) {
    updateMeter(0);
    return;
  }

  chrome.runtime.sendMessage({ type: 'get-waveform' }, (response) => {
    if (chrome.runtime.lastError) return;

    const samples = response?.waveform || [];
    const peak = samples.reduce((highest, value) => {
      const normalized = Math.abs(value - 128) * 2 / 255;
      return Math.max(highest, normalized);
    }, 0);
    const safePeak = peak < 0.03 ? 0 : peak;

    updateMeter(safePeak);
    const target = buildSpectrumTarget(samples);
    displayedWaveform = displayedWaveform.map((value, index) => value + (target[index] - value) * 0.15);
    drawWaveform(displayedWaveform);
  });
}

function drawWaveform(samples) {
  const width = waveform.width;
  const height = waveform.height;
  const startY = height - 6;
  const pointsCount = samples.length;

  const points = Array.from({ length: pointsCount }, (_, index) => {
    const value = samples[index] ?? 0;
    const x = 6 + (index / (pointsCount - 1)) * (width - 12);
    const y = startY - value * (height - 14);
    return { x, y };
  });

  waveformContext.clearRect(0, 0, width, height);
  waveformContext.fillStyle = '#111112';
  waveformContext.fillRect(0, 0, width, height);

  waveformContext.strokeStyle = 'rgba(245, 195, 102, 0.15)';
  waveformContext.lineWidth = 1;
  waveformContext.strokeRect(0.5, 0.5, width - 1, height - 1);

  const gradient = waveformContext.createLinearGradient(0, 0, 0, startY);
  gradient.addColorStop(0, 'rgba(245, 195, 102, 0.45)');
  gradient.addColorStop(0.5, 'rgba(212, 148, 44, 0.15)');
  gradient.addColorStop(1, 'rgba(17, 17, 18, 0)');

  waveformContext.beginPath();
  waveformContext.moveTo(points[0].x, startY);
  waveformContext.lineTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    waveformContext.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const last = points[points.length - 1];
  waveformContext.lineTo(last.x, last.y);
  waveformContext.lineTo(last.x, startY);
  waveformContext.closePath();
  waveformContext.fillStyle = gradient;
  waveformContext.fill();

  waveformContext.beginPath();
  waveformContext.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    waveformContext.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  waveformContext.lineTo(last.x, last.y);

  waveformContext.strokeStyle = '#f5c366';
  waveformContext.lineWidth = 1.8;
  waveformContext.shadowColor = '#e8a93e';
  waveformContext.shadowBlur = 6;
  waveformContext.stroke();
  waveformContext.shadowBlur = 0;
}

function animateSpectrum() {
  if (!capturing) {
    const idleTarget = Array(64).fill(0);
    displayedWaveform = displayedWaveform.map((value, index) => value + (idleTarget[index] - value) * 0.12);
    drawWaveform(displayedWaveform);
    updateMeter(0);
    requestAnimationFrame(animateSpectrum);
    return;
  }

  chrome.runtime.sendMessage({ type: 'get-waveform' }, (response) => {
    if (!chrome.runtime.lastError) {
      const samples = response?.waveform || [];
      const target = buildSpectrumTarget(samples);
      displayedWaveform = displayedWaveform.map((value, index) => {
        const targetVal = target[index];
        const factor = targetVal > value ? 0.35 : 0.12;
        return value + (targetVal - value) * factor;
      });

      const peak = samples.reduce((highest, value) => {
        const normalized = Math.abs(value - 128) * 2 / 255;
        return Math.max(highest, normalized);
      }, 0);
      updateMeter(peak < 0.03 ? 0 : peak);
      drawWaveform(displayedWaveform);
    }

    requestAnimationFrame(animateSpectrum);
  });
}

function updateProfilesUi() {
  const names = Object.keys(profiles).filter((name) => name !== 'default');
  profileSelect.innerHTML = `<option value="default">${text('defaultProfile')}</option>`;

  names.forEach((name) => {
    profileSelect.add(new Option(name, name));
  });

  currentProfile.textContent = `${language === 'en' ? 'Profile' : 'Профиль'}: ${
    profiles[currentHostname] ? currentHostname : text('default')
  }`;
}

async function initializePopup() {
  const stored = await chrome.storage.local.get({
    gainPercent: 100,
    compressorEnabled: true,
    mixerSettings,
    isPaidUser: false,
    profiles: {},
    hotkeysEnabled: false,
    language: 'en'
  });

  language = stored.language === 'ru' ? 'ru' : 'en';
  languageSelect.value = language;
  createEqControls();

  const tab = await getCurrentTab();
  currentHostname = tab?.url
    ? new URL(tab.url).hostname
    : text('currentTab');
  profiles = stored.profiles;
  mixerSettings = normalizeMixer(profiles[currentHostname] || stored.mixerSettings);

  gainSlider.value = stored.gainPercent;
  gainVal.textContent = `${stored.gainPercent}%`;
  compressorToggle.checked = stored.compressorEnabled;
  hotkeysToggle.checked = stored.hotkeysEnabled;
  siteLabel.textContent = `${text('currentTab')}: ${currentHostname}`;

  updateMixerUi();
  setMixerAccess(stored.isPaidUser);
  updateProfilesUi();
  applyTranslations();
  updateCaptureStatus();
}

startBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();
  if (!tab) return;

  if (capturing) {
    statusEl.textContent = text('stopping');
    chrome.runtime.sendMessage({ type: 'stop-capture', tabId: tab.id }, () => {
      capturing = false;
      updateCaptureStatus();
    });
    return;
  }

  statusEl.textContent = text('starting');
  chrome.runtime.sendMessage({
    type: 'start-capture',
    tabId: tab.id,
    gain: Number(gainSlider.value) / 100,
    compressor: compressorToggle.checked,
    mixer: mixerSettings
  }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      statusEl.textContent = response?.error || text('startError');
      return;
    }

    statusEl.textContent = '';
    updateCaptureStatus();
  });
});

gainSlider.addEventListener('input', () => {
  const gainPercent = Number(gainSlider.value);
  gainVal.textContent = `${gainPercent}%`;
  chrome.storage.local.set({ gainPercent });
  chrome.runtime.sendMessage({ type: 'set-gain', gain: gainPercent / 100 });
});

compressorToggle.addEventListener('change', () => {
  const enabled = compressorToggle.checked;
  chrome.storage.local.set({ compressorEnabled: enabled });
  chrome.runtime.sendMessage({ type: 'set-compressor', enabled });
});

thresholdSlider.addEventListener('input', () => {
  mixerSettings.threshold = Number(thresholdSlider.value);
  thresholdVal.textContent = `${mixerSettings.threshold} ${text('db')}`;
  saveAndApplyMixer();
});

balanceSlider.addEventListener('input', () => {
  mixerSettings.balance = Number(balanceSlider.value);
  balanceVal.textContent = getBalanceLabel(mixerSettings.balance);
  saveAndApplyMixer();
});

limiterToggle.addEventListener('change', () => {
  mixerSettings.limiter = limiterToggle.checked;
  saveAndApplyMixer();
});

presetSelect.addEventListener('change', () => {
  mixerSettings.eq = [...presets[presetSelect.value]];
  updateMixerUi();
  saveAndApplyMixer();
});

profileSelect.addEventListener('change', () => {
  const selectedProfile = profiles[profileSelect.value];
  if (!selectedProfile) return;

  mixerSettings = normalizeMixer(selectedProfile);
  updateMixerUi();
  saveAndApplyMixer();
});

saveProfileBtn.addEventListener('click', () => {
  profiles[currentHostname] = { ...mixerSettings };
  chrome.storage.local.set({ profiles });
  updateProfilesUi();
  statusEl.textContent = `${text('saved')} ${currentHostname}`;
});

hotkeysToggle.addEventListener('change', () => {
  chrome.storage.local.set({ hotkeysEnabled: hotkeysToggle.checked });
});

upgradeBtn.addEventListener('click', (event) => {
  event.preventDefault();
  statusEl.textContent = checkoutUrl
    ? text('checkoutOpening')
    : text('checkoutMissing');

  if (checkoutUrl) chrome.tabs.create({ url: checkoutUrl });
});

languageSelect.addEventListener('change', async () => {
  language = languageSelect.value;
  await chrome.storage.local.set({ language });
  applyTranslations();
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showScreen(tab.dataset.screen));
});

displayedWaveform = Array(64).fill(0);
drawWaveform(displayedWaveform);
requestAnimationFrame(animateSpectrum);
initializePopup();
