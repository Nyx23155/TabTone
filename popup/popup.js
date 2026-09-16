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
  voice: [-2, -2, -1, 2, 5, 5, 3, 2, 2, 1], music: [4, 3, 2, 0, -1, 1, 3, 4, 4, 3], bass: [8, 7, 5, 2, -1, -1, 1, 2, 2, 2],
  deepBass: [12, 10, 8, 3, -2, -2, -1, 0, 0, 0], podcast: [-4, -2, 0, 4, 6, 5, 3, 3, 2, 1], movie: [5, 4, 3, 1, 0, 2, 4, 5, 4, 3],
  gaming: [3, 2, 1, 2, 3, 4, 5, 5, 4, 3], details: [-2, -1, 0, 2, 3, 4, 6, 7, 6, 5], warm: [6, 5, 3, 2, 1, 0, -1, -2, -2, -2],
  night: [-5, -4, -3, 1, 2, 2, -1, -3, -4, -5], custom: Array(10).fill(0)
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
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = translations[language][element.dataset.i18n] || element.textContent; });
  Array.from(presetSelect.options).forEach((option) => { option.textContent = text('presets')[option.value] || option.textContent; });
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
    wrapper.innerHTML = `<label for="eq-${index}">${labels[index]}</label><input id="eq-${index}" type="range" min="-12" max="12" value="0" aria-label="${frequency} Hz"><span id="eq-value-${index}" class="eq-value">0 ${text('db')}</span>`;
    eqGrid.appendChild(wrapper);
    wrapper.querySelector('input').addEventListener('input', () => { mixerSettings.eq[index] = Number(wrapper.querySelector('input').value); wrapper.querySelector('.eq-value').textContent = `${mixerSettings.eq[index]} ${text('db')}`; presetSelect.value = 'custom'; saveAndApplyMixer(); });
  });
}

function normalizeMixer(settings = {}) {
  const legacy = [settings.bass, settings.bass, settings.bass, settings.mid, settings.mid, settings.mid, settings.treble, settings.treble, settings.treble, settings.treble];
  return { eq: Array.isArray(settings.eq) && settings.eq.length === 10 ? settings.eq.map(Number) : legacy.map((value) => Number(value) || 0), threshold: Number.isFinite(Number(settings.threshold)) ? Number(settings.threshold) : -12, balance: Number.isFinite(Number(settings.balance)) ? Number(settings.balance) : 0, limiter: settings.limiter !== false };
}

function updateMixerUi() {
  mixerSettings = normalizeMixer(mixerSettings);
  mixerSettings.eq.forEach((value, index) => { const input = document.getElementById(`eq-${index}`); if (input) { input.value = value; document.getElementById(`eq-value-${index}`).textContent = `${value} ${text('db')}`; } });
  thresholdSlider.value = mixerSettings.threshold;
  thresholdVal.textContent = `${mixerSettings.threshold} ${text('db')}`;
  balanceSlider.value = mixerSettings.balance;
  balanceVal.textContent = mixerSettings.balance === 0 ? text('center') : (mixerSettings.balance < 0 ? text('left') : text('right'));
  limiterToggle.checked = mixerSettings.limiter;
}

function setMixerAccess(enabled) {
  isPaidUser = enabled;
  mixerScreen.classList.toggle('pro-locked', !enabled); profilesScreen.classList.toggle('pro-locked', !enabled); paidBadge.classList.toggle('hidden', !enabled);
  presetSelect.disabled = !enabled; profileSelect.disabled = !enabled; saveProfileBtn.disabled = !enabled; eqGrid.querySelectorAll('input').forEach((input) => { input.disabled = !enabled; }); thresholdSlider.disabled = !enabled; balanceSlider.disabled = !enabled; limiterToggle.disabled = !enabled;
  premiumNote.textContent = enabled ? text('liveNote') : text('proNote'); upgradeBtn.classList.toggle('hidden', enabled);
}

function saveAndApplyMixer() { if (!isPaidUser) return; chrome.storage.local.set({ mixerSettings }); chrome.runtime.sendMessage({ type: 'set-mixer', settings: mixerSettings }); }
function showScreen(name) { document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === `${name}Screen`)); document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.screen === name)); }
async function getCurrentTab() { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); return tab; }

async function updateCaptureStatus() { const tab = await getCurrentTab(); if (!tab) return; chrome.runtime.sendMessage({ type: 'get-capture-status', tabId: tab.id }, (response) => { if (chrome.runtime.lastError) return; capturing = response?.active === true; startBtn.textContent = capturing ? text('disableForTab') : text('enableForTab'); updateMeter(response?.level || 0); }); }
function updateMeter(level) { levelValue.textContent = `${Math.round(Math.min(1, level) * 100)}%`; }
function refreshMeter() { if (!capturing) { updateMeter(0); drawWaveform([]); return; } chrome.runtime.sendMessage({ type: 'get-waveform' }, (response) => { if (chrome.runtime.lastError) return; const samples = response?.waveform || []; const peak = samples.reduce((highest, value) => Math.max(highest, Math.abs(value - 128)), 0) / 128; updateMeter(peak); drawWaveform(samples); }); }

function drawWaveform(samples) {
  const width = waveform.width; const height = waveform.height; const center = height / 2; const target = samples.length ? samples : Array(64).fill(128);
  const next = target.map((value, index) => (displayedWaveform[index] ?? 128) + (value - (displayedWaveform[index] ?? 128)) * 0.22); displayedWaveform = next;
  waveformContext.clearRect(0, 0, width, height); waveformContext.strokeStyle = 'rgba(212, 175, 104, 0.14)'; waveformContext.lineWidth = 1; waveformContext.beginPath(); waveformContext.moveTo(0, center); waveformContext.lineTo(width, center); waveformContext.stroke();
  const gradient = waveformContext.createLinearGradient(0, 0, width, 0); gradient.addColorStop(0, '#9d8150'); gradient.addColorStop(0.5, '#f0c875'); gradient.addColorStop(1, '#9d8150'); waveformContext.strokeStyle = gradient; waveformContext.shadowColor = 'rgba(240, 200, 117, 0.45)'; waveformContext.shadowBlur = 9; waveformContext.lineWidth = 2; waveformContext.beginPath();
  next.forEach((value, index) => { const x = (index / Math.max(1, next.length - 1)) * width; const y = center + (value - 128) * 0.38; if (index === 0) { waveformContext.moveTo(x, y); return; } const previousX = ((index - 1) / Math.max(1, next.length - 1)) * width; const previousY = center + (next[index - 1] - 128) * 0.38; waveformContext.quadraticCurveTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2); });
  waveformContext.stroke(); waveformContext.shadowBlur = 0;
}

function updateProfilesUi() { const names = Object.keys(profiles).filter((name) => name !== 'default'); profileSelect.innerHTML = `<option value="default">${text('defaultProfile')}</option>`; names.forEach((name) => profileSelect.add(new Option(name, name))); currentProfile.textContent = `${language === 'en' ? 'Profile' : 'Профиль'}: ${profiles[currentHostname] ? currentHostname : text('default')}`; }

async function initializePopup() {
  const stored = await chrome.storage.local.get({ gainPercent: 100, compressorEnabled: true, mixerSettings, isPaidUser: false, profiles: {}, hotkeysEnabled: false, language: 'en' });
  language = stored.language === 'ru' ? 'ru' : 'en'; languageSelect.value = language; createEqControls();
  const tab = await getCurrentTab(); currentHostname = tab?.url ? new URL(tab.url).hostname : text('currentTab'); profiles = stored.profiles; mixerSettings = normalizeMixer(profiles[currentHostname] || stored.mixerSettings); gainSlider.value = stored.gainPercent; gainVal.textContent = `${stored.gainPercent}%`; compressorToggle.checked = stored.compressorEnabled; hotkeysToggle.checked = stored.hotkeysEnabled; siteLabel.textContent = `${text('currentTab')}: ${currentHostname}`;
  updateMixerUi(); setMixerAccess(stored.isPaidUser); updateProfilesUi(); applyTranslations(); updateCaptureStatus();
}

startBtn.addEventListener('click', async () => { const tab = await getCurrentTab(); if (!tab) return; if (capturing) { statusEl.textContent = text('stopping'); chrome.runtime.sendMessage({ type: 'stop-capture', tabId: tab.id }, () => { capturing = false; updateCaptureStatus(); }); return; } statusEl.textContent = text('starting'); chrome.runtime.sendMessage({ type: 'start-capture', tabId: tab.id, gain: Number(gainSlider.value) / 100, compressor: compressorToggle.checked, mixer: mixerSettings }, (response) => { if (chrome.runtime.lastError || !response?.ok) { statusEl.textContent = response?.error || text('startError'); return; } statusEl.textContent = ''; updateCaptureStatus(); }); });
gainSlider.addEventListener('input', () => { gainVal.textContent = `${gainSlider.value}%`; chrome.storage.local.set({ gainPercent: Number(gainSlider.value) }); chrome.runtime.sendMessage({ type: 'set-gain', gain: Number(gainSlider.value) / 100 }); });
compressorToggle.addEventListener('change', () => { chrome.storage.local.set({ compressorEnabled: compressorToggle.checked }); chrome.runtime.sendMessage({ type: 'set-compressor', enabled: compressorToggle.checked }); });
thresholdSlider.addEventListener('input', () => { mixerSettings.threshold = Number(thresholdSlider.value); thresholdVal.textContent = `${mixerSettings.threshold} ${text('db')}`; saveAndApplyMixer(); });
balanceSlider.addEventListener('input', () => { mixerSettings.balance = Number(balanceSlider.value); balanceVal.textContent = mixerSettings.balance === 0 ? text('center') : (mixerSettings.balance < 0 ? text('left') : text('right')); saveAndApplyMixer(); });
limiterToggle.addEventListener('change', () => { mixerSettings.limiter = limiterToggle.checked; saveAndApplyMixer(); });
presetSelect.addEventListener('change', () => { mixerSettings.eq = [...presets[presetSelect.value]]; updateMixerUi(); saveAndApplyMixer(); });
profileSelect.addEventListener('change', () => { if (profiles[profileSelect.value]) { mixerSettings = normalizeMixer(profiles[profileSelect.value]); updateMixerUi(); saveAndApplyMixer(); } });
saveProfileBtn.addEventListener('click', () => { profiles[currentHostname] = { ...mixerSettings }; chrome.storage.local.set({ profiles }); updateProfilesUi(); statusEl.textContent = `${text('saved')} ${currentHostname}`; });
hotkeysToggle.addEventListener('change', () => chrome.storage.local.set({ hotkeysEnabled: hotkeysToggle.checked }));
upgradeBtn.addEventListener('click', (event) => { event.preventDefault(); statusEl.textContent = checkoutUrl ? text('checkoutOpening') : text('checkoutMissing'); if (checkoutUrl) chrome.tabs.create({ url: checkoutUrl }); });
languageSelect.addEventListener('change', async () => { language = languageSelect.value; await chrome.storage.local.set({ language }); applyTranslations(); });
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => showScreen(tab.dataset.screen)));

function animateWaveform() { refreshMeter(); requestAnimationFrame(animateWaveform); }
animateWaveform();
initializePopup();
