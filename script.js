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
  j: "Bb3",
  m: "B3",
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
  4: "Bb4",
  r: "B4",
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
  "-": "Bb5",
  "[": "B5",
};

const allNotes = [
  "C3",
  "Db3",
  "D3",
  "Eb3",
  "E3",
  "F3",
  "Gb3",
  "G3",
  "Ab3",
  "A3",
  "Bb3",
  "B3",
  "C4",
  "Db4",
  "D4",
  "Eb4",
  "E4",
  "F4",
  "Gb4",
  "G4",
  "Ab4",
  "A4",
  "Bb4",
  "B4",
  "C5",
  "Db5",
  "D5",
  "Eb5",
  "E5",
  "F5",
  "Gb5",
  "G5",
  "Ab5",
  "A5",
  "Bb5",
  "B5",
];

const keyboard = document.querySelector(".keyboard");
const activeNotes = new Set();
const activeSources = {};
const activeSynths = {};
const MIN_NOTE_DURATION = 80;

const modeSwitch = document.getElementById("mode-switch");
let useWavSamples = false;

function createAudioPlayer() {
  if (useWavSamples) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const audioBuffers = {};

    async function loadAudio() {
      for (const note of allNotes) {
        const url = `audio/piano/${note}.wav`;
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          audioBuffers[note] = await audioContext.decodeAudioData(arrayBuffer);
        } catch (e) {
          console.error(`Ошибка загрузки ${note}:`, e);
        }
      }
    }
    loadAudio();

    return {
      start: (note) => {
        if (!audioBuffers[note]) return;
        const src = audioContext.createBufferSource();
        src.buffer = audioBuffers[note];
        src.connect(audioContext.destination);
        src.start();
        if (!activeSources[note]) activeSources[note] = [];
        activeSources[note].push({
          src,
          startedAt: Date.now(),
          stopTimeout: null,
        });
      },
      stop: (note) => {
        if (activeSources[note] && activeSources[note].length) {
          activeSources[note].forEach((obj) => {
            const elapsed = Date.now() - obj.startedAt;
            if (obj.stopTimeout) clearTimeout(obj.stopTimeout);
            if (elapsed >= MIN_NOTE_DURATION) {
              obj.src.stop();
            } else {
              obj.stopTimeout = setTimeout(
                () => obj.src.stop(),
                MIN_NOTE_DURATION - elapsed
              );
            }
          });
          activeSources[note] = [];
        }
      },
      resume: () => {
        if (audioContext.state === "suspended") audioContext.resume();
      },
    };
  } else {
    const synth = new Tone.PolySynth().toDestination();
    return {
      start: (note) => {
        synth.triggerAttack(note);
        activeSynths[note] = true;
      },
      stop: (note) => {
        if (activeSynths[note]) {
          synth.triggerRelease(note);
          delete activeSynths[note];
        }
      },
      resume: async () => {
        if (Tone.context.state === "suspended") {
          await Tone.start();
          console.log("Tone.js context is now active.");
        }
      },
    };
  }
}

let audioPlayer = createAudioPlayer();

if (modeSwitch) {
  modeSwitch.checked = useWavSamples;
  modeSwitch.addEventListener("change", () => {
    useWavSamples = modeSwitch.checked;
    audioPlayer = createAudioPlayer();
    activeNotes.forEach((note) => {
      audioPlayer.stop(note);
      const el = document.querySelector(`[data-note="${note}"]`);
      if (el) el.classList.remove("active");
    });
    activeNotes.clear();
  });
}

function handlePress(note, element) {
  if (activeNotes.has(note)) {
    audioPlayer.stop(note);
    activeNotes.delete(note);
  }
  audioPlayer.start(note);
  activeNotes.add(note);
  if (element) element.classList.add("active");
}

function handleRelease(note, element) {
  audioPlayer.stop(note);
  activeNotes.delete(note);
  if (element) element.classList.remove("active");
}

keyboard.addEventListener("mousedown", (e) => {
  audioPlayer.resume();
  const el = e.target.closest("[data-note]");
  if (el) {
    handlePress(el.dataset.note, el);
  }
});

keyboard.addEventListener("mouseup", (e) => {
  const el = e.target.closest("[data-note]");
  if (el) {
    handleRelease(el.dataset.note, el);
  }
});

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const note = keyToNoteMap[key];
  if (note && !activeNotes.has(note)) {
    audioPlayer.resume();
    handlePress(note, document.querySelector(`[data-note="${note}"]`));
  }
});

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  const note = keyToNoteMap[key];
  if (note && activeNotes.has(note)) {
    handleRelease(note, document.querySelector(`[data-note="${note}"]`));
  }
});

const touchNoteMap = new Map();

["touchstart", "touchmove"].forEach((type) => {
  keyboard.addEventListener(
    type,
    (e) => {
      e.preventDefault();
      audioPlayer.resume();
      Array.from(e.changedTouches).forEach((touch) => {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const el = target && target.closest("[data-note]");
        const newNote = el ? el.dataset.note : null;

        if (
          touchNoteMap.has(touch.identifier) &&
          touchNoteMap.get(touch.identifier) !== newNote
        ) {
          const oldNote = touchNoteMap.get(touch.identifier);
          handleRelease(
            oldNote,
            document.querySelector(`[data-note="${oldNote}"]`)
          );
          touchNoteMap.delete(touch.identifier);
        }
        if (newNote && !touchNoteMap.has(touch.identifier)) {
          handlePress(newNote, el);
          touchNoteMap.set(touch.identifier, newNote);
        }
      });
    },
    { passive: false }
  );
});

["touchend", "pointerup", "pointercancel"].forEach((type) => {
  keyboard.addEventListener(type, (e) => {
    e.preventDefault();
    Array.from(e.changedTouches).forEach((touch) => {
      if (touchNoteMap.has(touch.identifier)) {
        const note = touchNoteMap.get(touch.identifier);
        handleRelease(note, document.querySelector(`[data-note="${note}"]`));
        touchNoteMap.delete(touch.identifier);
      }
    });
  });
});

keyboard.addEventListener("contextmenu", (e) => {
  if (e.target.closest("[data-note]")) e.preventDefault();
});
