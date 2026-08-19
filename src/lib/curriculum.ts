// Moteur pédagogique : parcours qui commence par l'alphabet complet,
// puis les syllabes, les mots et le calcul de la vie quotidienne.

import { ALPHABET } from "./letters";

export type SkillState =
  | "non_apprise"
  | "en_apprentissage"
  | "presque"
  | "maitrisee"
  | "consolidee";

export type Activity =
  | { kind: "letter"; id: string; upper: string; lower: string; sound: string; name: string; example: string }
  | { kind: "syllable"; id: string; parts: [string, string]; syllable: string }
  | { kind: "word"; id: string; pieces: string[]; word: string; hint: string }
  | { kind: "write"; id: string; target: string }
  | { kind: "count"; id: string; question: string; answer: number }
  | { kind: "money"; id: string; question: string; answer: number };

export type Lesson = {
  day: number;
  title: string;
  activities: Activity[];
};

const VOWELS = ["A", "E", "I", "O", "U"];

const WORDS: Array<{ pieces: string[]; word: string; hint: string; needs: string }> = [
  { pieces: ["MA", "MA"], word: "MAMA", hint: "la maman", needs: "MA" },
  { pieces: ["PA", "PA"], word: "PAPA", hint: "le papa", needs: "MAP" },
  { pieces: ["MO", "TO"], word: "MOTO", hint: "la moto", needs: "MOT" },
  { pieces: ["TA", "BLE"], word: "TABLE", hint: "la table", needs: "TABLE" },
  { pieces: ["RI", "Z"], word: "RIZ", hint: "le riz du marché", needs: "RIZ" },
  { pieces: ["SE", "L"], word: "SEL", hint: "le sel de la cuisine", needs: "SEL" },
  { pieces: ["BA", "NA", "NE"], word: "BANANE", hint: "la banane", needs: "BANE" },
  { pieces: ["TA", "XI"], word: "TAXI", hint: "le taxi", needs: "TAXI" },
  { pieces: ["MA", "LA", "DE"], word: "MALADE", hint: "quand on est malade", needs: "MALDE" },
  { pieces: ["PO", "RTE"], word: "PORTE", hint: "la porte de la maison", needs: "PORTE" },
];

const MONEY: Array<{ question: string; answer: number }> = [
  { question: "Tu as 1000 francs. Tu dépenses 500 francs. Il te reste combien ?", answer: 500 },
  { question: "Un kilo de riz coûte 600 francs. Tu paies avec 1000 francs. On te rend combien ?", answer: 400 },
  { question: "Tu achètes du sel à 100 francs et du poisson à 700 francs. Tu paies combien en tout ?", answer: 800 },
  { question: "Tu as 2000 francs. Le taxi coûte 300 francs. Il te reste combien ?", answer: 1700 },
];

function pick<T>(list: T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length] as T;
}

/** Lettres déjà vues au jour d (2 nouvelles lettres par jour, dans l'ordre). */
export function lettersKnown(day: number): string[] {
  const count = Math.min(ALPHABET.length, Math.max(2, day * 2));
  return ALPHABET.slice(0, count).map((l) => l.upper);
}

function syllablesFor(known: string[]): Array<[string, string]> {
  const consonants = known.filter((l) => !VOWELS.includes(l));
  const vowels = known.filter((l) => VOWELS.includes(l));
  const out: Array<[string, string]> = [];
  for (const c of consonants) for (const v of vowels) out.push([c, v]);
  return out;
}

/** Construit la séance du jour (≈15 minutes). */
export function buildLesson(day: number): Lesson {
  const d = Math.max(1, day);
  const first = ((d - 1) * 2) % ALPHABET.length;
  const l1 = pick(ALPHABET, first);
  const l2 = pick(ALPHABET, first + 1);
  const known = lettersKnown(d);
  const syls = syllablesFor(known);

  const activities: Activity[] = [
    { kind: "letter", id: `letter-${l1.upper}`, upper: l1.upper, lower: l1.lower, sound: l1.beginnerSound, name: l1.sound, example: l1.example },
    { kind: "letter", id: `letter-${l2.upper}`, upper: l2.upper, lower: l2.lower, sound: l2.beginnerSound, name: l2.sound, example: l2.example },
  ];

  if (syls.length > 0) {
    const s1 = pick(syls, d - 1);
    activities.push({
      kind: "syllable",
      id: `syl-${s1[0]}${s1[1]}`,
      parts: s1,
      syllable: `${s1[0]}${s1[1]}`,
    });
    if (syls.length > 1) {
      const s2 = pick(syls, d + 3);
      activities.push({
        kind: "syllable",
        id: `syl-${s2[0]}${s2[1]}`,
        parts: s2,
        syllable: `${s2[0]}${s2[1]}`,
      });
    }
  }

  if (d > 30) {
    activities.splice(2, 0, { kind: "write", id: `write-${l1.upper}`, target: l1.upper });
    activities.push({ kind: "write", id: `write-${l2.upper}`, target: l2.upper });
  }

  const readable = WORDS.filter((w) => w.needs.split("").every((c) => known.includes(c)));
  if (readable.length > 0) {
    const w = pick(readable, d - 1);
    activities.push({
      kind: "word",
      id: `word-${w.word}`,
      pieces: w.pieces,
      word: w.word,
      hint: w.hint,
    });
  }

  const count = ((d - 1) % 9) + 2;
  activities.push({
    kind: "count",
    id: `count-${count}`,
    question: "Compte avec moi. Combien de choses vois-tu ?",
    answer: count,
  });

  if (d >= 4) {
    const money = pick(MONEY, d - 1);
    activities.push({ kind: "money", id: `money-${d}`, question: money.question, answer: money.answer });
  }

  return {
    day: d,
    title:
      d <= 30 ? "Niveau 1 — J'écoute et je reconnais les sons"
        : d <= 60 ? "Niveau 2 — Je forme des syllabes et je trace"
          : d <= 90 ? "Niveau 3 — Je lis et j'écris des mots"
            : d <= 120 ? "Niveau 4 — Je construis des phrases"
              : d <= 150 ? "Niveau 5 — Je lis et j'écris dans la vie"
                : "Niveau 6 — Je rédige seul des messages et des textes",
    activities,
  };
}

export const PRAISE = [
  "Bravo ! C'est très bien.",
  "Ah ! Tu as réussi. Continue comme ça, je suis fier de toi.",
  "Très bien. Tu progresses vite, tu sais.",
  "Eh ! Cette fois-ci tu m'as surpris. Bravo !",
];

export const RETRY = [
  "Tu es presque arrivé. Écoute encore une fois, on le fait ensemble.",
  "Ce n'est pas grave du tout. On recommence tranquillement.",
  "Doucement, ce n'est pas grave. Écoute bien et répète après moi.",
];
