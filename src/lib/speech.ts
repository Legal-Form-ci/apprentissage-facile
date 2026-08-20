// Moteur vocal : voix de l'enseignant (TTS) + écoute de l'apprenant (STT)
import { speakServer } from "./tts.functions";
import { articulate, getClarity } from "./clarity";

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!canSpeak()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => /fr[-_](ci|sn|cm|bf)/i.test(v.lang)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("fr")) ?? voices[0] ?? null;
  return cachedVoice;
}

/* ------------------------------------------------------------------ */
/* Micro : on l'ouvre une seule fois, avec réduction du bruit ambiant  */
/* ------------------------------------------------------------------ */

let micStream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let micCtx: AudioContext | null = null;

/** Ouvre le micro avec suppression de bruit + annulation d'écho. */
export async function primeMic(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
  if (micStream) return true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        channelCount: 1,
      } as MediaTrackConstraints,
    });
    const WithWebkit = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext ?? WithWebkit.webkitAudioContext;
    if (Ctx) {
      micCtx = new Ctx();
      const src = micCtx.createMediaStreamSource(micStream);
      // Filtres : on coupe les graves (ronflement, vent) et les aigus (sifflements)
      const highpass = micCtx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 140;
      const lowpass = micCtx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 5200;
      analyser = micCtx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(highpass).connect(lowpass).connect(analyser);
    }
    return true;
  } catch {
    micStream = null;
    return false;
  }
}

/** Niveau sonore courant (0..1), utile pour savoir si l'apprenant parle. */
export function micLevel(): number {
  if (!analyser) return 0;
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = ((data[i] ?? 128) - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 6);
}

/* ------------------------------------------------------------------ */
/* Voix de l'enseignant                                                */
/* ------------------------------------------------------------------ */

const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;
let serverVoiceOk = true;

async function speakNatural(text: string): Promise<boolean> {
  if (!serverVoiceOk || typeof window === "undefined") return false;
  const { speed, volume } = getClarity();
  const key = `${speed}|${text}`;
  try {
    let base64 = audioCache.get(key);
    if (!base64) {
      const res = await speakServer({ data: { text: text.slice(0, 900), speed } });
      if (!res?.audio) {
        serverVoiceOk = false;
        return false;
      }
      base64 = res.audio;
      if (audioCache.size > 150) audioCache.clear();
      audioCache.set(key, base64);
    }
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audio.volume = Math.min(1, Math.max(0.2, volume));
    currentAudio = audio;
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      void audio.play().catch(() => resolve());
    });
    if (currentAudio === audio) currentAudio = null;
    return true;
  } catch {
    serverVoiceOk = false;
    return false;
  }
}

/** Prononciation posée mais sans lourdeur : petite respiration à la fin. */
export async function speak(text: string, opts: { rate?: number } = {}): Promise<void> {
  stopSpeaking();
  const clarity = getClarity();
  const shaped = articulate(text, clarity.articulation);
  const natural = await speakNatural(shaped);
  if (!natural) await speakBrowser(shaped, opts);
  await new Promise((r) => setTimeout(r, clarity.articulation >= 2 ? 320 : 180));
}

function speakBrowser(text: string, opts: { rate?: number } = {}): Promise<void> {
  if (!canSpeak()) return Promise.resolve();
  const clarity = getClarity();
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      u.rate = opts.rate ?? clarity.speed * 0.9;
      u.pitch = 0.85;
      u.volume = clarity.volume;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
      setTimeout(resolve, Math.min(22000, 1200 + text.length * 90));
    } catch {
      resolve();
    }
  });
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
}

export function playEncouragement(ok: boolean) {
  if (typeof window === "undefined") return;
  const WithWebkit = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextClass = window.AudioContext ?? WithWebkit.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  const notes = ok ? [523, 659, 784, 1046] : [190, 160];
  notes.forEach((frequency, i) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = ok ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(ok ? 0.14 : 0.08, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.16);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + i * 0.1);
    oscillator.stop(now + i * 0.1 + 0.18);
  });
  setTimeout(() => void ctx.close(), 1000);
}

/* ------------------------------------------------------------------ */
/* Écoute de l'apprenant                                               */
/* ------------------------------------------------------------------ */

type Recognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onspeechstart?: (() => void) | null;
};

export function canListen() {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export type HeardResult = {
  /** Tout ce qui a été entendu (alternatives comprises) */
  text: string;
  alternatives: string[];
  /** true si un son de voix a été détecté (même incompris) */
  voiced: boolean;
};

/**
 * Écoute une réponse courte. Robuste : reste ouverte, relance
 * automatiquement la reconnaissance quand elle se ferme trop vite,
 * et signale si l'apprenant a parlé même sans être compris.
 */
export function listenOnce(timeoutMs = 9000): Promise<HeardResult> {
  const empty: HeardResult = { text: "", alternatives: [], voiced: false };
  if (!canListen()) return Promise.resolve(empty);
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;

  return new Promise((resolve) => {
    let done = false;
    let voiced = false;
    let rec: Recognition | null = null;
    const deadline = Date.now() + timeoutMs;
    const alts = new Set<string>();

    const levelWatch = window.setInterval(() => {
      if (micLevel() > 0.12) voiced = true;
    }, 120);

    const finish = (value: string) => {
      if (done) return;
      done = true;
      window.clearInterval(levelWatch);
      try {
        rec?.abort();
      } catch {
        /* ignore */
      }
      resolve({ text: value, alternatives: [...alts], voiced: voiced || Boolean(value) });
    };

    const start = () => {
      if (done) return;
      if (Date.now() >= deadline) return finish([...alts][0] ?? "");
      rec = new Ctor() as Recognition;
      rec.lang = "fr-FR";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      rec.onspeechstart = () => {
        voiced = true;
      };
      rec.onresult = (e: any) => {
        const results = e?.results ?? [];
        let final = "";
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          for (let j = 0; j < (r?.length ?? 0); j++) {
            const t = String(r[j]?.transcript ?? "").trim();
            if (t) alts.add(t);
          }
          if (r?.isFinal) final = String(r[0]?.transcript ?? "").trim();
          if (r && !r.isFinal) voiced = true;
        }
        if (final) finish(final);
      };
      rec.onerror = (e: any) => {
        const err = String(e?.error ?? "");
        if (err === "not-allowed" || err === "service-not-allowed") return finish("");
        // no-speech / aborted / network : on relance, on n'abandonne pas
      };
      rec.onend = () => {
        if (done) return;
        const best = [...alts][0];
        if (best) return finish(best);
        window.setTimeout(start, 120);
      };
      try {
        rec.start();
      } catch {
        window.setTimeout(start, 250);
      }
    };

    void primeMic().then(start);
    window.setTimeout(() => finish([...alts][0] ?? ""), timeoutMs);
  });
}

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

const phoneticAliases: Record<string, string[]> = {
  aaa: ["a", "ah", "ha", "la", "ta"], iii: ["i", "hi", "y"], ooo: ["o", "oh", "eau", "au"],
  uuu: ["u", "hu"], eee: ["e", "eu", "heu"],
  meunn: ["m", "me", "mon", "meun", "mm", "aime"], leurr: ["l", "le", "leur", "lor", "elle"],
  beurr: ["b", "be", "beu", "bor", "bé"], reurr: ["r", "re", "reur", "ror", "air"],
  seuss: ["s", "se", "sss", "esse"], teutt: ["t", "te", "tt", "thé"],
  peupp: ["p", "pe", "pp", "pé"], deudd: ["d", "de", "dd", "dé"],
  neunn: ["n", "ne", "nn", "aine"], feuff: ["f", "fe", "ff", "effe"],
};

/** Score approximatif 0..1 entre ce qui est attendu et ce qui a été dit. */
export function matchScore(expected: string, said: string) {
  const a = normalize(expected);
  const b = normalize(said);
  if (!a || !b) return 0;
  if (b === a || b.includes(a) || a.includes(b)) return 1;
  if (phoneticAliases[a]?.some((alias) => b === alias || b.includes(alias))) return 0.95;
  // « aaaaa » pour « a » : on tolère la lettre tenue
  const squashA = a.replace(/(.)\1+/g, "$1");
  const squashB = b.replace(/(.)\1+/g, "$1").replace(/\s/g, "");
  if (squashA === squashB || squashB.includes(squashA)) return 0.9;
  const dist: number = levenshtein(a, b.slice(0, Math.max(a.length + 3, b.length)));
  return Math.max(0, 1 - dist / Math.max(a.length, 1));
}

/** Meilleur score parmi toutes les alternatives entendues. */
export function bestScore(expected: string, heard: HeardResult) {
  const all = [heard.text, ...heard.alternatives].filter(Boolean);
  return all.reduce((best, said) => Math.max(best, matchScore(expected, said)), 0);
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur: number[] = new Array<number>(n + 1).fill(0);
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[n] ?? 0;
}
