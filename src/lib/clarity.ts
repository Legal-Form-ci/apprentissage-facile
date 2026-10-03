// Réglage de clarté : volume, vitesse et articulation de la voix de l'enseignant.
export type Clarity = {
  volume: number;
  speed: number;
  articulation: number;
};

const KEY = "nnvle-clarity-v1";

export const CLARITY_PRESETS: Array<{ id: string; label: string; icon: string; value: Clarity }> = [
  { id: "lent", label: "Un peu plus posé", icon: "🐢", value: { volume: 1, speed: 0.92, articulation: 0 } },
  { id: "normal", label: "Tempo naturel", icon: "🙂", value: { volume: 1, speed: 1, articulation: 0 } },
  { id: "rapide", label: "Un peu plus vif", icon: "🐇", value: { volume: 1, speed: 1.06, articulation: 0 } },
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

/** Ne modifie jamais le texte prononcé : les pauses viennent de la ponctuation et du moteur vocal. */
export function articulate(text: string, _level = 0) {
  return text.replace(/\s+/g, " ").trim();
}
