// Moteur pédagogique : parcours en 5 niveaux, UNE seule lettre nouvelle par
// jour au début, révision automatique des sons difficiles, écriture repoussée
// à la fin du niveau, puis lecture (mot → phrase → texte) et dictée.

import { ALPHABET, type LetterInfo } from "./letters";

export type SkillState =
  | "non_apprise"
  | "en_apprentissage"
  | "presque"
  | "maitrisee"
  | "consolidee";

export type Activity =
  | { kind: "oral"; id: string; prompt: string; expected: string; visual: string }
  | { kind: "letter"; id: string; upper: string; lower: string; sound: string; name: string; example: string }
  | { kind: "syllable"; id: string; parts: [string, string]; syllable: string }
  | { kind: "word"; id: string; pieces: string[]; word: string; hint: string }
  | { kind: "read"; id: string; text: string; hint: string }
  | { kind: "dictation"; id: string; text: string; seconds: number }
  | { kind: "write"; id: string; target: string }
  | { kind: "count"; id: string; question: string; answer: number }
  | { kind: "money"; id: string; question: string; answer: number };

export type Lesson = {
  day: number;
  level: number;
  title: string;
  activities: Activity[];
};

/** 5 niveaux de 30 jours. */
export const DAYS_PER_LEVEL = 30;
export const MAX_LEVEL = 5;

export function levelOf(day: number) {
  return Math.min(MAX_LEVEL, Math.max(1, Math.ceil(Math.max(1, day) / DAYS_PER_LEVEL)));
}

const VOWELS = ["A", "E", "I", "O", "U"];

/** Ordre d'apprentissage : voyelles utiles d'abord, puis consonnes faciles. */
const ORDER = [
  "A", "M", "I", "L", "O", "P", "U", "T", "E", "R",
  "S", "N", "B", "D", "C", "F", "G", "V", "J", "K",
  "Z", "H", "Q", "X", "Y", "W",
];

function info(upper: string): LetterInfo {
  return (
    ALPHABET.find((l) => l.upper === upper) ??
    ({ upper, lower: upper.toLowerCase(), sound: upper, beginnerSound: upper, example: "" } as LetterInfo)
  );
}

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

/** Lectures réelles, de plus en plus longues : un mot, puis une phrase, puis un texte. */
const READINGS: string[][] = [
  ["LE RIZ", "LA MOTO", "LE TAXI", "LE SEL", "LA PORTE"],
  ["PAPA MANGE LE RIZ", "MAMA VA AU MARCHE", "LE TAXI EST LA", "LA PORTE EST OUVERTE"],
  [
    "MAMA VA AU MARCHE. ELLE ACHETE DU RIZ ET DU SEL.",
    "PAPA PREND LE TAXI. IL VA AU TRAVAIL A ABIDJAN.",
    "LE MATIN, JE BALAYE LA COUR. APRES, JE VAIS A L'ECOLE DU SOIR.",
  ],
  [
    "AUJOURD'HUI, LE MARCHE EST PLEIN. MAMA ACHETE DU RIZ, DU SEL ET DES BANANES. ELLE PAYE MILLE FRANCS ET ON LUI REND DEUX CENTS FRANCS.",
    "MON VOISIN EST MALADE. NOUS ALLONS A L'HOPITAL AVEC LE TAXI. LE DOCTEUR DIT QU'IL VA GUERIR. NOUS SOMMES CONTENTS.",
  ],
];

const DICTATIONS: string[] = [
  "MAMA",
  "LE RIZ",
  "PAPA MANGE LE RIZ",
  "MAMA VA AU MARCHE AVEC MOI",
  "LE MATIN JE BALAYE LA COUR ET JE VAIS AU TRAVAIL",
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

/** Lettres déjà vues : UNE nouvelle lettre par jour au niveau 1, deux ensuite. */
export function lettersKnown(day: number): string[] {
  const d = Math.max(1, day);
  if (d === 1) return [];
  const count = d <= 10 ? Math.ceil((d - 1) / 2) : 5 + Math.floor((d - 10) / 2);
  return ORDER.slice(0, Math.min(ORDER.length, count));
}

function syllablesFor(known: string[]): Array<[string, string]> {
  const consonants = known.filter((l) => !VOWELS.includes(l));
  const vowels = known.filter((l) => VOWELS.includes(l));
  const out: Array<[string, string]> = [];
  for (const c of consonants) for (const v of vowels) out.push([c, v]);
  return out;
}

function oralActivity(id: string, prompt: string, expected: string, visual: string): Activity {
  return { kind: "oral", id, prompt, expected, visual };
}

function letterActivity(upper: string, idPrefix = "letter"): Activity {
  const l = info(upper);
  return {
    kind: "letter",
    id: `${idPrefix}-${l.upper}`,
    upper: l.upper,
    lower: l.lower,
    sound: l.beginnerSound,
    name: l.sound,
    example: l.example,
  };
}

const TITLES = [
  "Niveau 1 — J'écoute et je reconnais les sons",
  "Niveau 2 — Je colle les sons et je trace mes premières lettres",
  "Niveau 3 — Je lis des mots et des phrases",
  "Niveau 4 — J'écris des phrases et je lis des textes",
  "Niveau 5 — Je rédige, je fais la dictée et j'écris mes messages",
];

/**
 * Construit la séance du jour (≈15 minutes).
 * `review` : identifiants des sons les plus difficiles, revus automatiquement.
 */
export function buildLesson(day: number, review: string[] = []): Lesson {
  const d = Math.max(1, day);
  const level = levelOf(d);
  const known = lettersKnown(d);
  const newLetter = known[known.length - 1];
  const activities: Activity[] = [];

  // Jour 1 : prélecture. Aucun texte à décoder.
  if (d === 1) {
    activities.push(
      oralActivity("oral-bonjour", "Dis bonjour avec moi. Bonjour !", "bonjour", "👋"),
      oralActivity("oral-vocal", "Écoute ma voix. Puis dis : ah.", "ah", "👂"),
      oralActivity("oral-oui", "Écoute. Je dis oui. À toi : oui.", "oui", "🗣️"),
      { kind: "count", id: "count-1", question: "Regarde les trois objets. Compte avec moi.", answer: 3 },
    );
    return { day: d, level, title: "Jour 1 — J'écoute, je parle et je découvre", activities };
  }

  const reviewLetter = review
    .map((id) => id.replace(/^letter-|^review-/, "").toUpperCase())
    .find((u) => u.length === 1 && known.includes(u) && u !== newLetter);

  if (reviewLetter) activities.push(letterActivity(reviewLetter, "review"));
  if (newLetter) activities.push(letterActivity(newLetter));

  const syls = syllablesFor(known);
  if (syls.length > 0 && known.filter((l) => !VOWELS.includes(l)).length >= 1) {
    const s = pick(syls, d - 1);
    activities.push({ kind: "syllable", id: `syl-${s.join("")}`, parts: s, syllable: s.join("") });
  }

  if (level >= 2) {
    const readable = WORDS.filter((w) => w.needs.split("").every((letter) => known.includes(letter)));
    if (readable.length > 0) {
      const w = pick(readable, d - 1);
      activities.push({ kind: "word", id: `word-${w.word}`, pieces: w.pieces, word: w.word, hint: w.hint });
    }
  }

  if (level >= 3) {
    const bank = READINGS[Math.min(READINGS.length - 1, level - 3)] as string[];
    const text = pick(bank, d - 1);
    activities.push({ kind: "read", id: `read-${level}-${d}`, text, hint: "lis à voix haute" });
  }

  const dayInLevel = ((d - 1) % DAYS_PER_LEVEL) + 1;
  if (newLetter && level >= 2 && dayInLevel > DAYS_PER_LEVEL - 6) {
    activities.push({ kind: "write", id: `write-${newLetter}`, target: newLetter });
  }

  if (level >= 5) {
    const text = pick(DICTATIONS, d - 1);
    activities.push({ kind: "dictation", id: `dictee-${d}`, text, seconds: Math.max(40, Math.min(120, text.length * 3)) });
  }

  const count = d === 2 ? 2 : Math.min(5, ((d - 3) % 4) + 2);
  activities.push({ kind: "count", id: `count-${count}`, question: "Compte les objets et dis-moi combien il y en a.", answer: count });

  if (d >= 7) {
    const money = pick(MONEY, d - 1);
    activities.push({ kind: "money", id: `money-${d}`, question: money.question, answer: money.answer });
  }

  return { day: d, level, title: TITLES[level - 1] ?? TITLES[0]!, activities };
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
