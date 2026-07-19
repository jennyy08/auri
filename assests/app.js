// ---------------------------------------------------------------------
// auri — Arduino App Lab front end
// Screens: home (tap to enter) -> customize hub
// Everything else (target-spaces / sound-selection / history /
// emergency-contact) is stubbed for now — wire those up the same way
// once their screens are built.
// ---------------------------------------------------------------------

// ----- DOM refs ---------------------------------------------------
const connectionStatus = document.getElementById('connection-status');
const statusDot = document.getElementById('status-dot');

const screenHome = document.getElementById('screen-home');
const screenCustomize = document.getElementById('screen-customize');
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

// sounds that should read as urgent (rose/red highlight) vs. routine (default highlight)
const URGENT_SOUNDS = new Set(['ambulance', 'firetruck', 'glass']);
const IDLE_SOUND_TEXT = 'listening for sounds';
let soundIdleTimer = null;

// ----- local UI state (hydrated from Python on connect) -----------
let state = {
  userName: '',
  haptics: true,
  lights: true,
  activeSpaceName: 'home',
  notifyLevelLabel: 'all sounds',
  emergencyEnabled: true,
};

// ----- screen navigation --------------------------------------------
function showScreen(el) {
  [screenHome, screenCustomize].forEach((s) => s.classList.remove('active'));
  el.classList.add('active');
}

enterBtn.addEventListener('click', () => showScreen(screenCustomize));

// nav cards to subpages that don't exist yet — stubbed
document.querySelectorAll('.nav-card[data-target]').forEach((card) => {
  card.addEventListener('click', () => {
    console.info(`[auri] "${card.dataset.target}" screen isn't built yet.`);
  });
});

// ----- render helpers -------------------------------------------------
function renderState() {
  userNameInput.value = state.userName;
  toggleHaptics.classList.toggle('on', state.haptics);
  toggleHaptics.setAttribute('aria-checked', String(state.haptics));
  toggleLights.classList.toggle('on', state.lights);
  toggleLights.setAttribute('aria-checked', String(state.lights));
  navSpaceValue.textContent = state.activeSpaceName;
  navNotifyValue.textContent = state.notifyLevelLabel;
  navEmergencyValue.textContent = state.emergencyEnabled ? 'on' : 'off';
}

// ----- WebUI setup ------------------------------------------------
const ui = new WebUI();
ui.on_connect(onUIConnected);
ui.on_disconnect(onUIDisconnected);

// live sound-detection feed from Python (same event your board already sends)
ui.on_message('led_status_update', onLedStatusUpdate);

// Python replies with the persisted app state after get_initial_state
ui.on_message('initial_state', onInitialState);

// Python streams every ASR event (speech_start/partial_text/text/speech_stop/error)
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
  // data: { led_is_on: bool, status_text: string, label: string }
  if (data.led_is_on) {
    statusDot.classList.add('active');
  } else {
    statusDot.classList.remove('active');
  }

  // main.py's last_detected never resets to "None" on its own (there's no
  // "sound stopped" event coming from the board), so we treat any falsy
  // label as "no sound to show" and otherwise manage the idle reset here
  // on a timer instead of waiting on the backend for it.
  const label = (data.label || '').trim();
  if (!label || label.toLowerCase() === 'none') {
    setSoundStatus(null);
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

  // revert to idle a few seconds after the most recent detection so the
  // card doesn't get stuck showing a stale sound forever
  soundIdleTimer = setTimeout(() => {
    soundStatusText.textContent = IDLE_SOUND_TEXT;
    soundStatusText.classList.remove('active', 'urgent');
  }, 4000);
}

function onInitialState(data) {
  // data shape is up to main.py — merge whatever it sends over sane
  // defaults so a partial payload still renders correctly.
  state = { ...state, ...data };
  renderState();
}

// ----- settings -> Python ------------------------------------------
let nameDebounce;
userNameInput.addEventListener('input', (e) => {
  state.userName = e.target.value;
  clearTimeout(nameDebounce);
  nameDebounce = setTimeout(() => {
    ui.send_message('set_user_name', { name: state.userName });
  }, 300);
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

// the DOM line currently being updated in place for the active utterance.
// null whenever there's no "in progress" line to write into, which forces
// the next partial/final event to start a brand new line.
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
  // remove the placeholder "tap listen..." line the first time something arrives
  const empty = transcriptLog.querySelector('.transcript-empty');
  if (empty) empty.remove();

  const line = document.createElement('p');
  line.className = `transcript-line ${kind}`;
  line.textContent = text;
  transcriptLog.appendChild(line);
  transcriptLog.scrollTop = transcriptLog.scrollHeight;

  // keep the log from growing unbounded
  while (transcriptLog.children.length > 40) {
    transcriptLog.removeChild(transcriptLog.firstChild);
  }

  return line;
}

// Updates the current utterance's line in place instead of creating a new
// one. Google's streaming recognizer resends identical or slightly-refined
// partial/final text several times per utterance — without this, every
// repeat or refinement was rendering as its own line ("Hello. Hello.
// Hello."). Only speech_start (a genuinely new utterance) resets
// currentUtteranceLine to null so the next word starts a fresh line.
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
  // data: { eventType: string, text: string }
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
      currentUtteranceLine = null; // the only place a new line gets started
      setUtteranceLine('…', 'partial');
      break;
    case 'partial_text':
      if (text) setUtteranceLine(text, 'partial');
      break;
    case 'text': {
      if (!text) break;
      const matched = state.userName.trim() && text.toLowerCase().includes(state.userName.trim().toLowerCase());
      // update in place — do NOT clear currentUtteranceLine here.
      // Google can emit several "text" refinements for one continuous
      // utterance before speech_start fires again for the next one.
      setUtteranceLine(matched ? `${text} — name match ✓` : text, matched ? 'match' : 'final');
      break;
    }
    case 'speech_stop':
      // no visible line needed — text/partial_text already covered it
      break;
    default:
      break;
  }
}

// initial paint before the backend responds
soundStatusText.textContent = IDLE_SOUND_TEXT;
renderState();
