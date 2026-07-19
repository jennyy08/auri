// ---------------------------------------------------------------------
// auri — Arduino App Lab front end
// Supports: home -> customize hub -> subpages
// ---------------------------------------------------------------------

const connectionStatus = document.getElementById('connection-status');
const statusDot = document.getElementById('status-dot');

const screenHome = document.getElementById('screen-home');
const screenCustomize = document.getElementById('screen-customize');
const screenTarget = document.getElementById('screen-target-spaces');
const screenSound = document.getElementById('screen-sound-selection');
const screenHistory = document.getElementById('screen-history');
const screenEmergency = document.getElementById('screen-emergency');

const enterBtn = document.getElementById('enter-btn');

const userNameInput = document.getElementById('user-name');
const toggleHaptics = document.getElementById('toggle-haptics');
const toggleLights = document.getElementById('toggle-lights');
const transcriptLog = document.getElementById('transcript-log');
const transcriptLiveDot = document.getElementById('transcript-live-dot');
const listenBtn = document.getElementById('listen-btn');

const navSpaceValue = document.getElementById('nav-space-value');
const navNotifyValue = document.getElementById('nav-notify-value');
const navEmergencyValue = document.getElementById('nav-emergency-value');

const soundStatusText = document.getElementById('sound-status-text');

const URGENT_SOUNDS = new Set(['ambulance', 'firetruck', 'glass']);
const IDLE_SOUND_TEXT = 'listening for sounds';
let soundIdleTimer = null;

let state = {
  userName: '',
  haptics: true,
  lights: true,
  activeSpaceName: 'home',
  notifyLevelLabel: 'all sounds',
  emergencyEnabled: true,
  activeSpaceId: 'home',
  activeSpaceName: 'home',
  notifyLevel: 'all',
  sounds: [
    { id: 'baby-crying', name: 'baby crying', enabled: true, classification: 'important' },
    { id: 'dog-bark', name: 'dog bark', enabled: true, classification: 'important' },
    { id: 'door-knock', name: 'door knock', enabled: true, classification: 'important' },
    { id: 'smoke-alarm', name: 'smoke alarm', enabled: true, classification: 'emergency' },
    { id: 'car-horn', name: 'car horn', enabled: false, classification: 'informational' },
    { id: 'bicycle-bell', name: 'bicycle bell', enabled: true, classification: 'informational' },
    { id: 'name-call', name: 'name call', enabled: false, classification: 'important' },
  ],
  spaces: [
    { id: 'home', name: 'home', sounds: ['baby-crying', 'dog-bark', 'door-knock', 'smoke-alarm'] },
    { id: 'outdoor', name: 'outdoor', sounds: ['car-horn', 'dog-bark', 'bicycle-bell'] },
    { id: 'sleep', name: 'sleep', sounds: ['smoke-alarm'] },
    { id: 'custom', name: 'custom', sounds: [] },
  ],
  history: [
    { id: 1, sound: 'door knock', space: 'home', time: '2 min ago' },
    { id: 2, sound: 'dog bark', space: 'outdoor', time: '18 min ago' },
    { id: 3, sound: 'smoke alarm', space: 'sleep', time: 'yesterday' },
  ],
  emergency: {
    enabled: true,
    method: 'text',
    contacts: [{ name: '', number: '' }],
    times: 3,
    minutes: 5,
  },
};


function showScreen(screenName) {
  const screens = [screenHome, screenCustomize, screenTarget, screenSound, screenHistory, screenEmergency];
  screens.forEach((s) => s.classList.remove('active'));
  if (screenName === 'home') screenHome.classList.add('active');
  if (screenName === 'customize') screenCustomize.classList.add('active');
  if (screenName === 'target-spaces') screenTarget.classList.add('active');
  if (screenName === 'sound-selection') screenSound.classList.add('active');
  if (screenName === 'history') screenHistory.classList.add('active');
  if (screenName === 'emergency-contact') screenEmergency.classList.add('active');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderState() {
  userNameInput.value = state.userName;
  toggleHaptics.classList.toggle('on', state.haptics);
  toggleHaptics.setAttribute('aria-checked', String(state.haptics));
  toggleLights.classList.toggle('on', state.lights);
  toggleLights.setAttribute('aria-checked', String(state.lights));
  navSpaceValue.textContent = state.activeSpaceName;
  navNotifyValue.textContent = state.notifyLevelLabel;
  navEmergencyValue.textContent = state.emergency.enabled ? 'on' : 'off';
}

function getSpaceById(id) {
  return state.spaces.find((s) => s.id === id) || null;
}

function getSoundById(id) {
  return state.sounds.find((s) => s.id === id) || null;
}

function renderTargetSpaces() {
  const container = document.getElementById('target-space-list');
  container.innerHTML = '';

  const cards = state.spaces.map((space) => {
    const isActive = space.id === state.activeSpaceId;
    const chips = space.sounds.map((soundId) => {
      const sound = getSoundById(soundId);
      return `<button type="button" class="chip active" data-action="toggle-space-sound" data-space-id="${space.id}" data-sound-id="${soundId}">${escapeHtml(sound ? sound.name : soundId)}</button>`;
    });

    const available = state.sounds
      .filter((s) => !space.sounds.includes(s.id))
      .map((s) => `<button type="button" class="chip" data-action="toggle-space-sound" data-space-id="${space.id}" data-sound-id="${s.id}">${escapeHtml(s.name)}</button>`)
      .join('');

    return `
      <div class="panel-card ${isActive ? 'active' : ''}">
        <div class="panel-head">
          <strong>${escapeHtml(space.name)}</strong>
          <button type="button" class="secondary-btn small" data-action="select-space" data-space-id="${space.id}">${isActive ? 'active' : 'select'}</button>
        </div>
        <div class="chip-row">
          ${chips.join('')}
          ${available}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cards;
}

function renderSoundSelection() {
  const container = document.getElementById('sound-selection-list');
  if (!container) return;

  container.innerHTML = `
    <div class="notify-level-row">
      <button class="notify-pill ${state.notifyLevel === 'all' ? 'active' : ''}" onclick="setNotifyLevel('all')">
        all sounds
      </button>
      <button class="notify-pill ${state.notifyLevel === 'emergency-important' ? 'active' : ''}" onclick="setNotifyLevel('emergency-important')">
        emergency & important
      </button>
      <button class="notify-pill ${state.notifyLevel === 'emergency-only' ? 'active' : ''}" onclick="setNotifyLevel('emergency-only')">
        emergency only
      </button>
    </div>

    ${state.sounds.map((sound) => {
      const allowed = shouldNotifySound(sound, state.notifyLevel);
      return `
        <div class="sound-card ${allowed ? 'allowed' : 'muted'}">
          <div class="sound-row">
            <span>${sound.name}</span>
            <button onclick="toggleSound('${sound.id}')">
              ${sound.enabled ? 'on' : 'off'}
            </button>
          </div>
          <small>${sound.classification}</small>
        </div>
      `;
    }).join('')}
  `;
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!state.history.length) {
    container.innerHTML = '<div class="panel-card"><p class="row-sub">nothing detected yet</p></div>';
    return;
  }
  container.innerHTML = state.history.map((entry) => `
    <div class="panel-card">
      <div class="panel-head">
        <strong>${escapeHtml(entry.sound)}</strong>
        <span class="muted">${escapeHtml(entry.time)}</span>
      </div>
      <p class="row-sub">${escapeHtml(entry.space)}</p>
    </div>
  `).join('');
}

function renderEmergency() {
  const container = document.getElementById('emergency-contact-list');
  const toggle = document.getElementById('emergency-toggle');
  const timesInput = document.getElementById('emergency-times');
  const minsInput = document.getElementById('emergency-minutes');
  const saveBtn = document.getElementById('save-emergency-btn');

  toggle.classList.toggle('on', state.emergency.enabled);
  toggle.setAttribute('aria-checked', String(state.emergency.enabled));
  timesInput.value = state.emergency.times;
  minsInput.value = state.emergency.minutes;

  container.innerHTML = state.emergency.contacts.map((contact, index) => `
    <div class="panel-card">
      <div class="inline-inputs">
        <input class="emergency-input" data-field="name" data-index="${index}" value="${escapeHtml(contact.name)}" placeholder="name" />
        <input class="emergency-input" data-field="number" data-index="${index}" value="${escapeHtml(contact.number)}" placeholder="000-0000" />
      </div>
    </div>
  `).join('');

  saveBtn.textContent = state.emergency.enabled ? 'save' : 'save (disabled)';
}

function updateActiveSpaceName() {
  const space = getSpaceById(state.activeSpaceId);
  state.activeSpaceName = space ? space.name : 'home';
}

function handleSelectSpace(spaceId) {
  state.activeSpaceId = spaceId;
  updateActiveSpaceName();
  renderState();
  renderTargetSpaces();
}

function handleToggleSpaceSound(spaceId, soundId) {
  const space = getSpaceById(spaceId);
  if (!space) return;

  if (space.sounds.includes(soundId)) {
    space.sounds = space.sounds.filter((id) => id !== soundId);
  } else {
    space.sounds = [...space.sounds, soundId];
  }

  updateActiveSpaceName();
  renderState();
  renderTargetSpaces();
}

function handleToggleSound(soundId) {
  const sound = getSoundById(soundId);
  if (!sound) return;
  sound.enabled = !sound.enabled;
  renderSoundSelection();
}

function handleEmergencyInputChange(index, field, value) {
  state.emergency.contacts[index][field] = value;
}

function handleEmergencyToggle() {
  state.emergency.enabled = !state.emergency.enabled;
  renderEmergency();
  renderState();
}

function handleAddContact() {
  state.emergency.contacts.push({ name: '', number: '' });
  renderEmergency();
}

function handleSaveEmergency() {
  state.emergency.times = Number(document.getElementById('emergency-times').value || 1);
  state.emergency.minutes = Number(document.getElementById('emergency-minutes').value || 1);
  renderEmergency();
  renderState();
}

function handleTestAlert() {
  state.history.unshift({
    id: Date.now(),
    sound: 'test alert',
    space: state.activeSpaceName,
    time: 'just now',
  });
  renderHistory();
  alert('test alert sent');
}

function handleDetectedSound(soundId) {
  const sound = state.sounds.find((s) => s.id === soundId);
  if (!shouldNotifySound(sound, state.notifyLevel)) return;

  // only buzz / vibrate / alert if this passes the filter
  console.log('notify:', sound?.name);
  // your vibration / LED / buzzer logic here
}

// ----- screen navigation ------------------------------------------------
enterBtn.addEventListener('click', () => showScreen('customize'));

document.querySelectorAll('.nav-card[data-target]').forEach((card) => {
  card.addEventListener('click', () => {
    showScreen(card.dataset.target);
  });
});

document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  // --- ADD THIS BLOCK HERE ---
  if (action === 'run-simulation-test') {
    console.log("[auri] Initiating system audio hardware simulation sequence...");
    ui.send_message('trigger_test_mode', {});
    return;
  }
  // ---------------------------

  if (action === 'back-customize') {
    showScreen('customize');
    return;
  }

  if (action === 'select-space') {
    handleSelectSpace(btn.dataset.spaceId);
    return;
  }

  if (action === 'toggle-space-sound') {
    handleToggleSpaceSound(btn.dataset.spaceId, btn.dataset.soundId);
    return;
  }

  if (action === 'toggle-sound') {
    handleToggleSound(btn.dataset.soundId);
    return;
  }
});


document.body.addEventListener('input', (e) => {
  if (e.target.classList.contains('emergency-input')) {
    const index = Number(e.target.dataset.index || 0);
    const field = e.target.dataset.field;
    handleEmergencyInputChange(index, field, e.target.value);
  }
});

document.getElementById('emergency-toggle').addEventListener('click', handleEmergencyToggle);
document.getElementById('add-contact-btn').addEventListener('click', handleAddContact);
document.getElementById('save-emergency-btn').addEventListener('click', handleSaveEmergency);
document.getElementById('test-alert-btn').addEventListener('click', handleTestAlert);

// ----- render helpers -------------------------------------------------
function renderAll() {
  renderState();
  renderTargetSpaces();
  renderSoundSelection();
  renderHistory();
  renderEmergency();
}

// ----- WebUI setup ---------------------------------------------------
const ui = new WebUI();
ui.on_connect(onUIConnected);
ui.on_disconnect(onUIDisconnected);
ui.on_message('led_status_update', onLedStatusUpdate);
ui.on_message('initial_state', onInitialState);
ui.on_message('asr_transcript', onAsrTranscript);

function onUIConnected() {
  connectionStatus.textContent = 'Connected';
  connectionStatus.className = 'badge status-connected';
  ui.send_message('get_initial_state', {});
}

function onUIDisconnected() {
  connectionStatus.textContent = 'Offline';
  connectionStatus.className = 'badge status-offline';
  statusDot.classList.remove('active');
  setListening(false);
}

function onLedStatusUpdate(data) {
  if (data.led_is_on) {
    statusDot.classList.add('active');
  } else {
    statusDot.classList.remove('active');
  }

  const label = (data.label || '').trim();
  if (!label || label.toLowerCase() === 'none') {
    setSoundStatus(null);
    return;
  }

  if (label.toLowerCase() === 'traffic') {
    setSoundStatus('waiting...');
    return;
  }

  setSoundStatus(label);
}

function setSoundStatus(label) {
  clearTimeout(soundIdleTimer);

  if (!label) {
    soundStatusText.textContent = IDLE_SOUND_TEXT;
    soundStatusText.classList.remove('active', 'urgent');
    return;
  }

  soundStatusText.textContent = label.toUpperCase();
  soundStatusText.classList.add('active');
  soundStatusText.classList.toggle('urgent', URGENT_SOUNDS.has(label.toLowerCase()));

  soundIdleTimer = setTimeout(() => {
    soundStatusText.textContent = IDLE_SOUND_TEXT;
    soundStatusText.classList.remove('active', 'urgent');
  }, 4000);
}

function onInitialState(data) {
  state = { ...state, ...data };
  renderAll();
}

// ----- settings -> Python ------------------------------------------
let nameDebounce;

userNameInput.addEventListener('input', (e) => {
  state.userName = e.target.value;
  clearTimeout(nameDebounce);
  nameDebounce = setTimeout(() => {
    ui.send_message('set_user_name', { name: state.userName });
  }, 300);
  renderState();
});

toggleHaptics.addEventListener('click', () => {
  state.haptics = !state.haptics;
  renderState();
  ui.send_message('set_haptics', { enabled: state.haptics });
});

toggleLights.addEventListener('click', () => {
  state.lights = !state.lights;
  renderState();
  ui.send_message('set_lights', { enabled: state.lights });
});

// ----- live transcript / listen button --------------------------------
let isListening = false;
let currentUtteranceLine = null;

listenBtn.addEventListener('click', () => {
  if (isListening) {
    ui.send_message('stop_listening', {});
    return;
  }
  if (!state.userName.trim()) {
    appendTranscriptLine('Set your name first.', 'error');
    return;
  }
  clearTranscriptLog();
  ui.send_message('start_listening', {});
});

function setListening(on) {
  isListening = on;
  listenBtn.textContent = on ? 'stop' : 'listen';
  listenBtn.classList.toggle('listening', on);
  transcriptLiveDot.classList.toggle('live', on);
}

function clearTranscriptLog() {
  transcriptLog.innerHTML = '';
  currentUtteranceLine = null;
}

function appendTranscriptLine(text, kind) {
  const empty = transcriptLog.querySelector('.transcript-empty');
  if (empty) empty.remove();

  const line = document.createElement('p');
  line.className = `transcript-line ${kind}`;
  line.textContent = text;
  transcriptLog.appendChild(line);
  transcriptLog.scrollTop = transcriptLog.scrollHeight;

  while (transcriptLog.children.length > 40) {
    transcriptLog.removeChild(transcriptLog.firstChild);
  }

  return line;
}

function setUtteranceLine(text, kind) {
  if (currentUtteranceLine) {
    currentUtteranceLine.className = `transcript-line ${kind}`;
    currentUtteranceLine.textContent = text;
    transcriptLog.scrollTop = transcriptLog.scrollHeight;
  } else {
    currentUtteranceLine = appendTranscriptLine(text, kind);
  }
}

function onAsrTranscript(data) {
  const { eventType, text } = data;

  switch (eventType) {
    case 'session_start':
      setListening(true);
      appendTranscriptLine('listening…', 'system');
      break;
    case 'session_end':
      setListening(false);
      appendTranscriptLine('stopped', 'system');
      currentUtteranceLine = null;
      break;
    case 'error':
      setListening(false);
      appendTranscriptLine(text || 'transcription error', 'error');
      currentUtteranceLine = null;
      break;
    case 'speech_start':
      currentUtteranceLine = null;
      setUtteranceLine('…', 'partial');
      break;
    case 'partial_text':
      if (text) setUtteranceLine(text, 'partial');
      break;
    case 'text': {
      if (!text) break;
      const matched = state.userName.trim() && text.toLowerCase().includes(state.userName.trim().toLowerCase());
      setUtteranceLine(matched ? `${text} — name match ✓` : text, matched ? 'match' : 'final');
      break;
    }
    case 'speech_stop':
      break;
    default:
      break;
  }
}

// ----- notify / sound filtering -----

const NOTIFY_LEVELS = {
  all: {
    label: 'all sounds',
    blurb: 'notify for every enabled sound'
  },
  'emergency-important': {
    label: 'emergency & important',
    blurb: 'only notify for emergency and important sounds'
  },
  'emergency-only': {
    label: 'emergency only',
    blurb: 'only notify for emergency sounds'
  }
};

function shouldNotifySound(sound, level) {
  if (!sound || !sound.enabled) return false;

  switch (level) {
    case 'all':
      return true;

    case 'emergency-important':
      return sound.classification === 'emergency' || sound.classification === 'important';

    case 'emergency-only':
      return sound.classification === 'emergency';

    default:
      return true;
  }
}

function renderSoundSelection() {
  const container = document.getElementById('sound-selection-list');
  if (!container) return;

  container.innerHTML = `
    <div class="notify-level-row">
      <button class="notify-pill ${state.notifyLevel === 'all' ? 'active' : ''}" onclick="setNotifyLevel('all')">
        all sounds
      </button>
      <button class="notify-pill ${state.notifyLevel === 'emergency-important' ? 'active' : ''}" onclick="setNotifyLevel('emergency-important')">
        emergency & important
      </button>
      <button class="notify-pill ${state.notifyLevel === 'emergency-only' ? 'active' : ''}" onclick="setNotifyLevel('emergency-only')">
        emergency only
      </button>
    </div>

    <!-- NEW TEST SIMULATION TRIGGER CARD -->
    <div class="sound-card" style="background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.3); padding: 14px; border-radius: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="color: #60a5fa; font-size: 14px; display: block;">🧪 Sequential Test Mode</strong>
        <small style="color: #94a3b8; font-size: 11px;">Cycle through all primary hardware alerts</small>
      </div>
      <button type="button" data-action="run-simulation-test" style="background: #2563eb; border: none; color: #fff; padding: 6px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px;">Run Test</button>
    </div>

    ${state.sounds.map((sound) => {
      const allowed = shouldNotifySound(sound, state.notifyLevel);
      return `
        <div class="sound-card ${allowed ? 'allowed' : 'muted'}">
          <div class="sound-row">
            <span>${sound.name}</span>
            <button onclick="toggleSound('${sound.id}')">
              ${sound.enabled ? 'on' : 'off'}
            </button>
          </div>
          <small>${sound.classification}</small>
        </div>
      `;
    }).join('')}
  `;
}

function setNotifyLevel(level) {
  state.notifyLevel = level;
  state.notifyLevelLabel = NOTIFY_LEVELS[level].label;
  renderSoundSelection();
  renderState();

  // send to Python/backend so the hardware side uses the same rule
  ui.send_message('set_notification_level', { level });
}

function toggleSound(soundId) {
  const sound = state.sounds.find((s) => s.id === soundId);
  if (!sound) return;
  sound.enabled = !sound.enabled;
  renderSoundSelection();
}

// initial paint
soundStatusText.textContent = IDLE_SOUND_TEXT;
renderAll();
showScreen('home');


