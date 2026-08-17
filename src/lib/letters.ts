// Alphabet complet, dans l'ordre, avec le son et le tracé de chaque lettre.

export type LetterInfo = {
  upper: string;
  lower: string;
  /** ce que l'enseignant prononce : le son de la lettre */
  sound: string;
  /** un mot repère de la vie quotidienne */
  example: string;
};

export const ALPHABET: LetterInfo[] = [
  { upper: "A", lower: "a", sound: "a", example: "comme dans ananas" },
  { upper: "B", lower: "b", sound: "bé", example: "comme dans banane" },
  { upper: "C", lower: "c", sound: "cé", example: "comme dans cola" },
  { upper: "D", lower: "d", sound: "dé", example: "comme dans dodo" },
  { upper: "E", lower: "e", sound: "eu", example: "comme dans école" },
  { upper: "F", lower: "f", sound: "effe", example: "comme dans farine" },
  { upper: "G", lower: "g", sound: "gé", example: "comme dans gari" },
  { upper: "H", lower: "h", sound: "ache", example: "comme dans hôpital" },
  { upper: "I", lower: "i", sound: "i", example: "comme dans igname" },
  { upper: "J", lower: "j", sound: "ji", example: "comme dans jardin" },
  { upper: "K", lower: "k", sound: "ka", example: "comme dans kola" },
  { upper: "L", lower: "l", sound: "elle", example: "comme dans lampe" },
  { upper: "M", lower: "m", sound: "emme", example: "comme dans maman" },
  { upper: "N", lower: "n", sound: "enne", example: "comme dans natte" },
  { upper: "O", lower: "o", sound: "o", example: "comme dans orange" },
  { upper: "P", lower: "p", sound: "pé", example: "comme dans papa" },
  { upper: "Q", lower: "q", sound: "ku", example: "comme dans quatre" },
  { upper: "R", lower: "r", sound: "erre", example: "comme dans riz" },
  { upper: "S", lower: "s", sound: "esse", example: "comme dans sel" },
  { upper: "T", lower: "t", sound: "té", example: "comme dans taxi" },
  { upper: "U", lower: "u", sound: "u", example: "comme dans usine" },
  { upper: "V", lower: "v", sound: "vé", example: "comme dans vélo" },
  { upper: "W", lower: "w", sound: "double vé", example: "comme dans wagon" },
  { upper: "X", lower: "x", sound: "ikse", example: "comme dans taxi" },
  { upper: "Y", lower: "y", sound: "i grec", example: "comme dans yaourt" },
  { upper: "Z", lower: "z", sound: "zède", example: "comme dans zéro" },
];

/** Tracé de la lettre, découpé en gestes numérotés (repère 100 x 100). */
export const STROKES: Record<string, string[]> = {
  A: ["M20 90 L50 12", "M50 12 L80 90", "M32 60 L68 60"],
  B: ["M28 10 L28 90", "M28 10 C70 10 70 50 28 50", "M28 50 C75 50 75 90 28 90"],
  C: ["M78 25 C40 0 15 30 15 50 C15 70 40 100 78 75"],
  D: ["M28 10 L28 90", "M28 10 C85 15 85 85 28 90"],
  E: ["M75 12 L25 12", "M25 12 L25 90", "M25 50 L65 50", "M25 90 L75 90"],
  F: ["M75 12 L25 12", "M25 12 L25 90", "M25 50 L65 50"],
  G: ["M78 25 C40 0 15 30 15 50 C15 72 45 100 78 78", "M78 78 L78 55", "M78 55 L55 55"],
  H: ["M25 10 L25 90", "M75 10 L75 90", "M25 50 L75 50"],
  I: ["M50 12 L50 90"],
  J: ["M60 12 L60 70 C60 92 30 92 25 72"],
  K: ["M28 10 L28 90", "M75 10 L30 52", "M40 45 L78 90"],
  L: ["M28 10 L28 90", "M28 90 L78 90"],
  M: ["M20 90 L20 12", "M20 12 L50 55", "M50 55 L80 12", "M80 12 L80 90"],
  N: ["M22 90 L22 12", "M22 12 L78 90", "M78 90 L78 12"],
  O: ["M50 10 C15 10 15 90 50 90 C85 90 85 10 50 10"],
  P: ["M28 90 L28 10", "M28 10 C78 10 78 55 28 55"],
  Q: ["M50 10 C15 10 15 90 50 90 C85 90 85 10 50 10", "M62 70 L85 95"],
  R: ["M28 90 L28 10", "M28 10 C78 10 78 52 28 52", "M45 52 L78 90"],
  S: ["M75 22 C55 5 25 12 28 32 C31 52 70 48 72 68 C74 88 40 95 25 78"],
  T: ["M20 14 L80 14", "M50 14 L50 90"],
  U: ["M25 12 L25 60 C25 92 75 92 75 60", "M75 60 L75 12"],
  V: ["M22 12 L50 90", "M50 90 L78 12"],
  W: ["M15 12 L32 90", "M32 90 L50 35", "M50 35 L68 90", "M68 90 L85 12"],
  X: ["M25 12 L75 90", "M75 12 L25 90"],
  Y: ["M25 12 L50 50", "M75 12 L50 50", "M50 50 L50 90"],
  Z: ["M25 14 L75 14", "M75 14 L25 88", "M25 88 L78 88"],
};

/** Les gestes à faire pour écrire une lettre, une syllabe ou un mot court. */
export function strokesFor(target: string): string[] {
  const key = (target[0] ?? "").toUpperCase();
  return STROKES[key] ?? STROKES.I ?? [];
}

/** Conseil parlé sur le sens du tracé. */
export function strokeAdvice(target: string): string {
  const key = (target[0] ?? "").toUpperCase();
  if ("OCGQSU".includes(key)) return "On part du haut et on tourne doucement, comme un cercle.";
  if ("EFHILT".includes(key)) return "On descend d'abord tout droit, du haut vers le bas, puis on fait les barres.";
  if ("AMNVWXYZ".includes(key)) return "On fait des traits penchés, toujours du haut vers le bas.";
  return "On commence toujours par le haut, puis on descend doucement.";
}
