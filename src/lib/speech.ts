// Moteur vocal : voix de l'enseignant (TTS) + écoute de l'apprenant (STT)

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

export function speak(text: string, opts: { rate?: number } = {}): Promise<void> {
  if (!canSpeak()) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      u.rate = opts.rate ?? 0.82;
      u.pitch = 0.88;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
      // filet de sécurité si onend ne se déclenche pas
      setTimeout(resolve, Math.min(15000, 1200 + text.length * 90));
    } catch {
      resolve();
    }
  });
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
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
    gain.gain.setValueAtTime(ok ? 0.14 : 0.08, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + i * 0.12);
    oscillator.stop(now + i * 0.12 + 0.2);
  });
  setTimeout(() => void ctx.close(), 1000);
}

type Recognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

export function canListen() {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** Écoute une réponse courte. Résout avec le texte entendu ("" si rien). */
export function listenOnce(timeoutMs = 6000): Promise<string> {
  if (!canListen()) return Promise.resolve("");
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  const rec: Recognition = new Ctor();
  rec.lang = "fr-FR";
  rec.continuous = false;
  rec.interimResults = false;

  return new Promise((resolve) => {
    let done = false;
    const finish = (value: string) => {
      if (done) return;
      done = true;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      resolve(value);
    };
    rec.onresult = (e: any) => {
      const said = e?.results?.[0]?.[0]?.transcript ?? "";
      finish(String(said));
    };
    rec.onerror = () => finish("");
    rec.onend = () => finish("");
    try {
      rec.start();
    } catch {
      finish("");
    }
    setTimeout(() => finish(""), timeoutMs);
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

/** Score approximatif 0..1 entre ce qui est attendu et ce qui a été dit. */
export function matchScore(expected: string, said: string) {
  const a = normalize(expected);
  const b = normalize(said);
  if (!a || !b) return 0;
  if (b === a || b.includes(a) || a.includes(b)) return 1;
  const phoneticAliases: Record<string, string[]> = {
    aaa: ["a", "ah"], iii: ["i", "hi"], ooo: ["o", "oh"], uuu: ["u"],
    meunn: ["m", "me", "mon", "meun"], leurr: ["l", "le", "leur", "lor"],
    beurr: ["b", "be", "beu", "bor"], reurr: ["r", "re", "reur", "ror"],
  };
  if (phoneticAliases[a]?.some((alias) => b === alias || b.includes(alias))) return 0.95;
  const dist: number = levenshtein(a, b.slice(0, Math.max(a.length + 3, b.length)));
  return Math.max(0, 1 - dist / Math.max(a.length, 1));
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
