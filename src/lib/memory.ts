// Mémoire vivante de l'enseignant : il retient les habitudes, les réactions,
// les émotions et les demandes de l'apprenant, et s'en sert pour s'adapter.

export type MemoryEvent = {
  at: string;
  /** ce qui s'est passé : réussite, échec, demande, émotion, remarque */
  kind: "reussite" | "echec" | "demande" | "emotion" | "note";
  text: string;
};

export type Memory = {
  events: MemoryEvent[];
  /** compteurs d'habitudes : sons difficiles, moments de fatigue… */
  habits: Record<string, number>;
  mood: string;
};

const KEY = "nnvle-memory-v1";
const MAX_EVENTS = 120;

export function loadMemory(): Memory {
  if (typeof window === "undefined") return { events: [], habits: {}, mood: "" };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { events: [], habits: {}, mood: "" };
    const parsed = JSON.parse(raw) as Memory;
    return { events: parsed.events ?? [], habits: parsed.habits ?? {}, mood: parsed.mood ?? "" };
  } catch {
    return { events: [], habits: {}, mood: "" };
  }
}

function save(memory: Memory) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* stockage indisponible */
  }
}

export function remember(kind: MemoryEvent["kind"], text: string, habit?: string) {
  const memory = loadMemory();
  memory.events.push({ at: new Date().toISOString(), kind, text: text.slice(0, 220) });
  if (memory.events.length > MAX_EVENTS) memory.events = memory.events.slice(-MAX_EVENTS);
  if (habit) memory.habits[habit] = (memory.habits[habit] ?? 0) + 1;
  save(memory);
}

export function rememberMood(mood: string) {
  const memory = loadMemory();
  memory.mood = mood;
  save(memory);
}

/** Ce que l'enseignant « garde en tête » : résumé court pour l'IA. */
export function memorySummary(): string {
  const memory = loadMemory();
  const hardest = Object.entries(memory.habits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, v]) => `${k} (${v} fois)`)
    .join(", ");
  const recent = memory.events
    .slice(-12)
    .map((e) => `- ${e.kind} : ${e.text}`)
    .join("\n");
  return [
    memory.mood ? `Humeur retenue : ${memory.mood}.` : "",
    hardest ? `Difficultés répétées : ${hardest}.` : "",
    recent ? `Derniers moments :\n${recent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Les sons qui résistent le plus : à retravailler en priorité. */
export function hardestSkills(limit = 3): string[] {
  const memory = loadMemory();
  return Object.entries(memory.habits)
    .filter(([k]) => k.startsWith("difficile:"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k.replace("difficile:", ""));
}
