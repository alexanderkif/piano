const keyToNoteMap = {
  z: "C3",
  s: "Db3",
  x: "D3",
  d: "Eb3",
  c: "E3",
  v: "F3",
  g: "Gb3",
  b: "G3",
  h: "Ab3",
  n: "A3",
  j: "Hb3",
  m: "H3",
  ",": "C4",
  l: "Db4",
  ".": "D4",
  ";": "Eb4",
  "/": "E4",
  q: "F4",
  2: "Gb4",
  w: "G4",
  3: "Ab4",
  e: "A4",
  4: "Hb4",
  r: "H4",
  t: "C5",
  6: "Db5",
  y: "D5",
  7: "Eb5",
  u: "E5",
  i: "F5",
  9: "Gb5",
  o: "G5",
  0: "Ab5",
  p: "A5",
  "-": "Hb5",
  "[": "H5",
};

const allNotes = [
  "C3","Db3","D3","Eb3","E3","F3","Gb3","G3","Ab3","A3","Hb3","H3",
  "C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Hb4","H4",
  "C5","Db5","D5","Eb5","E5","F5","Gb5","G5","Ab5","A5","Hb5","H5"
];

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const audioBuffers = {};
const activeNotes = new Set();
const activeSources = {};
const MIN_NOTE_DURATION = 80;
const keyboard = document.querySelector('.keyboard');

async function loadAudio(note) {
  const url = `audio/piano/${note}.wav`;
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffers[note] = await audioContext.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error(`Ошибка загрузки ${note}:`, e);
  }
}
allNotes.forEach(loadAudio);

function resumeContext() {
  if (audioContext.state === 'suspended') audioContext.resume();
}

function playSound(note) {
  if (!audioBuffers[note]) return;
  const src = audioContext.createBufferSource();
  src.buffer = audioBuffers[note];
  src.connect(audioContext.destination);
  src.start();
  if (!activeSources[note]) activeSources[note] = [];
  activeSources[note].push({ src, startedAt: Date.now(), stopTimeout: null });
}

function stopSound(note) {
  if (activeSources[note] && activeSources[note].length) {
    activeSources[note].forEach(obj => {
      const elapsed = Date.now() - obj.startedAt;
      if (obj.stopTimeout) clearTimeout(obj.stopTimeout);
      if (elapsed >= MIN_NOTE_DURATION) {
        obj.src.stop();
      } else {
        obj.stopTimeout = setTimeout(() => {
          obj.src.stop();
        }, MIN_NOTE_DURATION - elapsed);
      }
    });
    activeSources[note] = [];
  }
}

keyboard.addEventListener('mousedown', e => {
  resumeContext();
  const el = e.target.closest('[data-note]');
  if (el) {
    const note = el.dataset.note;
    if (activeNotes.has(note)) stopSound(note);
    playSound(note);
    activeNotes.add(note);
    el.classList.add('active');
  }
});
keyboard.addEventListener('mouseup', e => {
  const el = e.target.closest('[data-note]');
  if (el) {
    const note = el.dataset.note;
    stopSound(note);
    activeNotes.delete(note);
    el.classList.remove('active');
  }
});

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const note = keyToNoteMap[key];
  if (note && !activeNotes.has(note)) {
    resumeContext();
    playSound(note);
    activeNotes.add(note);
    const el = document.querySelector(`[data-note="${note}"]`);
    if (el) el.classList.add('active');
  }
});
document.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  const note = keyToNoteMap[key];
  if (note && activeNotes.has(note)) {
    stopSound(note);
    activeNotes.delete(note);
    const el = document.querySelector(`[data-note="${note}"]`);
    if (el) el.classList.remove('active');
  }
});

function updateTouchesAndActiveNotes(e) {
  const touches = Array.from(e.touches || []);
  const touchedNotes = new Set();
  touches.forEach(touch => {
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const el = target && target.closest('[data-note]');
    if (el) touchedNotes.add(el.dataset.note);
  });
  activeNotes.forEach(note => {
    if (!touchedNotes.has(note)) {
      stopSound(note);
      activeNotes.delete(note);
      const el = document.querySelector(`[data-note="${note}"]`);
      if (el) el.classList.remove('active');
    }
  });
}

keyboard.addEventListener('contextmenu', e => {
  if (e.target.closest('[data-note]')) e.preventDefault();
});

['touchstart', 'touchend', 'touchmove'].forEach(type => {
  keyboard.addEventListener(type, e => {
    if (!e.target.closest('[data-note]')) return;
    if (type === 'touchstart') {
      resumeContext();
      const note = e.target.closest('[data-note]').dataset.note;
      if (activeNotes.has(note)) stopSound(note);
      playSound(note);
      activeNotes.add(note);
      e.target.closest('[data-note]').classList.add('active');
    }
    updateTouchesAndActiveNotes(e);
  });
});
