// Moteur pédagogique : programme, compétences, séance du jour

export type SkillState =
  | "non_apprise"
  | "en_apprentissage"
  | "presque"
  | "maitrisee"
  | "consolidee";

export type Activity =
  | { kind: "letter"; id: string; letter: string; sound: string }
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

const LETTERS: Array<{ letter: string; sound: string }> = [
  { letter: "A", sound: "a" },
  { letter: "M", sound: "meu" },
  { letter: "P", sound: "peu" },
  { letter: "O", sound: "o" },
  { letter: "T", sound: "teu" },
  { letter: "I", sound: "i" },
  { letter: "B", sound: "beu" },
  { letter: "N", sound: "neu" },
  { letter: "U", sound: "u" },
  { letter: "L", sound: "leu" },
  { letter: "E", sound: "eu" },
  { letter: "R", sound: "reu" },
  { letter: "S", sound: "sss" },
  { letter: "D", sound: "deu" },
  { letter: "K", sound: "keu" },
];

const SYLLABLES: Array<[string, string]> = [
  ["M", "A"],
  ["M", "O"],
  ["M", "I"],
  ["P", "A"],
  ["P", "O"],
  ["T", "A"],
  ["T", "O"],
  ["B", "A"],
  ["N", "A"],
  ["L", "A"],
  ["R", "I"],
  ["S", "O"],
  ["D", "A"],
  ["K", "O"],
  ["M", "U"],
];

const WORDS: Array<{ pieces: string[]; word: string; hint: string }> = [
  { pieces: ["MA", "MA"], word: "MAMA", hint: "la maman" },
  { pieces: ["PA", "PA"], word: "PAPA", hint: "le papa" },
  { pieces: ["MO", "TO"], word: "MOTO", hint: "la moto" },
  { pieces: ["TA", "XI"], word: "TAXI", hint: "le taxi" },
  { pieces: ["RI", "Z"], word: "RIZ", hint: "le riz du marché" },
  { pieces: ["SE", "L"], word: "SEL", hint: "le sel" },
  { pieces: ["BA", "NA", "NE"], word: "BANANE", hint: "la banane" },
  { pieces: ["MA", "LA", "DE"], word: "MALADE", hint: "quand on est malade" },
  { pieces: ["MA", "MAN"], word: "MAMAN", hint: "maman" },
  { pieces: ["PO", "RTE"], word: "PORTE", hint: "la porte de la maison" },
  { pieces: ["BU", "S"], word: "BUS", hint: "le bus" },
  { pieces: ["EA", "U"], word: "EAU", hint: "l'eau à boire" },
];

const MONEY: Array<{ question: string; answer: number }> = [
  { question: "Tu as 1000 francs. Tu dépenses 500 francs. Il reste combien ?", answer: 500 },
  { question: "Un kilo de riz coûte 600 francs. Tu paies avec 1000 francs. On te rend combien ?", answer: 400 },
  { question: "Tu achètes du sel à 100 francs et du poisson à 700 francs. Tu paies combien ?", answer: 800 },
  { question: "Tu as 2000 francs. Le taxi coûte 300 francs. Il reste combien ?", answer: 1700 },
];

function pick<T>(list: T[], index: number): T {
  return list[index % list.length] as T;
}

/** Construit la séance du jour (≈15 minutes) selon le jour du parcours. */
export function buildLesson(day: number): Lesson {
  const d = Math.max(1, day);
  const letter = pick(LETTERS, d - 1);
  const syl = pick(SYLLABLES, d - 1);
  const syl2 = pick(SYLLABLES, d);
  const word = pick(WORDS, d - 1);
  const money = pick(MONEY, d - 1);
  const count = ((d - 1) % 9) + 2;

  const activities: Activity[] = [
    { kind: "letter", id: `letter-${letter.letter}`, letter: letter.letter, sound: letter.sound },
    {
      kind: "syllable",
      id: `syl-${syl[0]}${syl[1]}`,
      parts: syl,
      syllable: `${syl[0]}${syl[1]}`,
    },
    {
      kind: "syllable",
      id: `syl-${syl2[0]}${syl2[1]}`,
      parts: syl2,
      syllable: `${syl2[0]}${syl2[1]}`,
    },
    { kind: "word", id: `word-${word.word}`, pieces: word.pieces, word: word.word, hint: word.hint },
    { kind: "write", id: `write-${letter.letter}`, target: letter.letter },
    {
      kind: "count",
      id: `count-${count}`,
      question: `Combien de choses vois-tu ?`,
      answer: count,
    },
    { kind: "money", id: `money-${d}`, question: money.question, answer: money.answer },
  ];

  return {
    day: d,
    title:
      d <= 30
        ? "Je commence à lire et à écrire"
        : d <= 60
          ? "Je lis des mots et des petites phrases"
          : "Je me débrouille dans la vie quotidienne",
    activities,
  };
}

export const PRAISE = [
  "Bravo ! C'est très bien.",
  "Ah ! Tu as réussi. Continue comme ça.",
  "Très bien. Tu progresses bien.",
  "Eh ! Cette fois-ci tu m'as surpris.",
];

export const RETRY = [
  "Tu es presque arrivé. Écoute encore une fois.",
  "Ce n'est pas grave. On recommence ensemble.",
  "Écoute bien, puis répète après moi.",
];
