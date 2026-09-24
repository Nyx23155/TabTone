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
let eqLevels = new Array(frequencies.length).fill(0);
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

let ribbonPhase = 0;

function buildSpectrumTarget(samples) {
  if (!samples || !samples.length) return [0, 0, 0];

  const total = samples.length;
  const kickEnd = Math.max(2, Math.floor(total * 0.05));
  let kickPeak = 0;
  for (let i = 0; i < kickEnd; i++) {
    if (samples[i] > kickPeak) kickPeak = samples[i];
  }
  const kick = Math.pow(kickPeak / 255, 1.8);

  const bassEnd = Math.floor(total * 0.15);
  let bassSum = 0;
  for (let i = kickEnd; i < bassEnd; i++) bassSum += samples[i];
  const bassRumble = bassSum / ((bassEnd - kickEnd) * 255);

  const snareEnd = Math.floor(total * 0.45);
  let snarePeak = 0;
  for (let i = bassEnd; i < snareEnd; i++) {
    if (samples[i] > snarePeak) snarePeak = samples[i];
  }
  const snare = snarePeak / 255;

  return [kick, snare, bassRumble];
}

function updateEqMeters(samples) {
  const bandRatios = [0.02, 0.05, 0.09, 0.15, 0.24, 0.35, 0.48, 0.62, 0.78, 0.92];

  if (!samples || !samples.length) {
    eqLevels = eqLevels.map((level) => level * 0.82);
    eqLevels.forEach((level, index) => renderEqLevel(index, level));
    return;
  }

  const sampleCount = samples.length;

  frequencies.forEach((_, index) => {
    const centerIndex = Math.floor(bandRatios[index] * sampleCount);
    const start = Math.max(0, centerIndex - 2);
    const end = Math.min(sampleCount, centerIndex + 3);
    let peak = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      peak = Math.max(peak, Number(samples[sampleIndex]) || 0);
    }

    const target = peak / 255;
    const response = target > eqLevels[index] ? 0.7 : 0.15;
    eqLevels[index] += (target - eqLevels[index]) * response;
    renderEqLevel(index, eqLevels[index]);
  });
}

function renderEqLevel(index, level) {
  const input = document.getElementById(`eq-${index}`);
  if (!input) return;

  const percent = Math.min(100, Math.round(level * 100));
  if (percent <= 2) {
    input.style.background = '#1c1a17';
    input.style.boxShadow = 'none';
    return;
  }

  input.style.background = `linear-gradient(to right, #e5a93b 0%, #f5c366 ${percent}%, #1c1a17 ${percent}%, #1c1a17 100%)`;
  input.style.boxShadow = `0 0 6px rgba(245, 195, 102, ${(percent / 100) * 0.5})`;
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

function createIdleWaveform() {
  return [0, 0, 0];
}

function drawWaveform(samples) {
  const width = waveform.width;
  const height = waveform.height;
  const centerY = height / 2;
  const kick = samples[0] ?? 0;
  const snare = samples[1] ?? 0;
  const rumble = samples[2] ?? 0;
  const kickResponse = kick * 2;
  const snareResponse = snare * 2;
  const activeAmp = 0.04 + kickResponse * 0.88 + rumble * 0.25;
  const maxPixelAmp = (height * 0.44) * Math.min(1.0, activeAmp);

  ribbonPhase += (0.04 + kickResponse * 0.09 + snareResponse * 0.06) * 0.75;

  waveformContext.clearRect(0, 0, width, height);
  waveformContext.fillStyle = '#111112';
  waveformContext.fillRect(0, 0, width, height);

  waveformContext.strokeStyle = 'rgba(245, 195, 102, 0.15)';
  waveformContext.lineWidth = 1;
  waveformContext.strokeRect(0.5, 0.5, width - 1, height - 1);

  waveformContext.save();
  waveformContext.globalCompositeOperation = 'lighter';

  const waveFreq = 4.5 + snareResponse * 5.5;
  const ribbons = [
    { phaseShift: 0, ampMult: 1.0, color: '#f5c366', glow: '#e8a93e', width: 2.2, blur: 12 + kickResponse * 14 },
    { phaseShift: 1.7, ampMult: 0.75, color: 'rgba(238, 175, 75, 0.8)', glow: '#d48e28', width: 1.8, blur: 8 + kickResponse * 8 },
    { phaseShift: 3.4, ampMult: 0.5, color: 'rgba(255, 220, 140, 0.6)', glow: '#f5c366', width: 1.2, blur: 5 }
  ];

  const steps = 70;
  const edgeFlatMargin = 14;

  ribbons.forEach((ribbon) => {
    waveformContext.beginPath();
    waveformContext.strokeStyle = ribbon.color;
    waveformContext.lineWidth = ribbon.width + kickResponse * 0.8;
    waveformContext.shadowColor = ribbon.glow;
    waveformContext.shadowBlur = ribbon.blur;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * width;
      let envelope = Math.pow(Math.sin(t * Math.PI), 2.0);

      if (x < edgeFlatMargin || x > width - edgeFlatMargin) envelope = 0;

      const wave1 = Math.sin(t * waveFreq + ribbonPhase + ribbon.phaseShift);
      const wave2 = Math.cos(t * (waveFreq * 0.6) - ribbonPhase * 0.85);
      const bassJitter = Math.sin(t * 32.0 + ribbonPhase * 3.0) * (rumble * 0.22);
      const totalWave = wave1 * 0.65 + wave2 * 0.35 + bassJitter;
      const waveY = totalWave * maxPixelAmp * ribbon.ampMult * envelope;
      const y = centerY + waveY;

      if (i === 0) waveformContext.moveTo(x, y);
      else waveformContext.lineTo(x, y);
    }

    waveformContext.stroke();
  });

  waveformContext.restore();
}

function animateSpectrum() {
  if (!capturing) {
    const idleTarget = createIdleWaveform();
    displayedWaveform = displayedWaveform.map((value, index) => value + (idleTarget[index] - value) * 0.12);
    drawWaveform(displayedWaveform);
    updateEqMeters([]);
    updateMeter(0);
    requestAnimationFrame(animateSpectrum);
    return;
  }

  chrome.runtime.sendMessage({ type: 'get-waveform' }, (response) => {
    if (!chrome.runtime.lastError) {
      const samples = response?.waveform || [];
      updateEqMeters(samples);
      const target = buildSpectrumTarget(samples);
      displayedWaveform[0] += (target[0] - displayedWaveform[0])
        * (target[0] > displayedWaveform[0] ? 0.65 : 0.14);
      displayedWaveform[1] += (target[1] - displayedWaveform[1])
        * (target[1] > displayedWaveform[1] ? 0.50 : 0.12);
      displayedWaveform[2] += (target[2] - displayedWaveform[2])
        * (target[2] > displayedWaveform[2] ? 0.45 : 0.10);

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

displayedWaveform = createIdleWaveform();
drawWaveform(displayedWaveform);
requestAnimationFrame(animateSpectrum);
initializePopup();
