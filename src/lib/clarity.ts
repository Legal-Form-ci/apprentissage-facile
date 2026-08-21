// Réglage de clarté : volume, vitesse et articulation de la voix de l'enseignant.
export type Clarity = {
  /** 0.6 → 1 : volume de la voix */
  volume: number;
  /** 0.7 → 1.15 : vitesse de la parole */
  speed: number;
  /** 0 → 2 : articulation (ajoute des pauses entre les mots des consignes) */
  articulation: number;
};

const KEY = "nnvle-clarity-v1";

export const CLARITY_PRESETS: Array<{ id: string; label: string; icon: string; value: Clarity }> = [
  { id: "lent", label: "Très clair, plus posé", icon: "🐢", value: { volume: 1, speed: 0.85, articulation: 2 } },
  { id: "normal", label: "Tempo normal", icon: "🙂", value: { volume: 1, speed: 1, articulation: 1 } },
  { id: "rapide", label: "Plus vif", icon: "🐇", value: { volume: 1, speed: 1.12, articulation: 0 } },
];

export const DEFAULT_CLARITY: Clarity = CLARITY_PRESETS[1]!.value;

let cache: Clarity | null = null;

export function getClarity(): Clarity {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_CLARITY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT_CLARITY, ...(JSON.parse(raw) as Clarity) } : DEFAULT_CLARITY;
  } catch {
    cache = DEFAULT_CLARITY;
  }
  return cache;
}

export function setClarity(next: Clarity) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
}

/** Articulation : on ajoute de courtes respirations pour que la voix soit plus nette. */
export function articulate(text: string, level = getClarity().articulation) {
  if (level <= 0) return text;
  const words = text.split(/\s+/);
  const every = level >= 2 ? 3 : 5;
  return words
    .map((w, i) => (i > 0 && i % every === 0 && !/[,.!?…]$/.test(words[i - 1] ?? "") ? `, ${w}` : w))
    .join(" ");
}
