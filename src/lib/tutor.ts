// Côté apprenant : on comprend l'intention, avec l'IA quand c'est possible,
// et avec des règles simples hors connexion.

import { normalize, type HeardResult } from "./speech";
import { memorySummary, remember, rememberMood } from "./memory";
import { tutorTurn } from "./tutor.functions";

export type Intent =
  | "reponse"
  | "repeter"
  | "reprendre"
  | "pause"
  | "question"
  | "emotion"
  | "hors_sujet";

export type TutorReply = {
  intent: Intent;
  correct: boolean | null;
  reply: string;
  mood: string;
  note: string;
  next: "continuer" | "refaire" | "revenir_debut" | "arreter";
};

/** Lecture rapide de l'intention, sans connexion. */
export function localIntent(said: string): Intent {
  const t = normalize(said);
  if (/\b(repete|repetez|redis|encore|jai pas entendu|pas compris)\b/.test(t)) return "repeter";
  if (/\b(reprend|reprenons|recommence|recommencer|depuis le debut|au debut|reprendre)\b/.test(t))
    return "reprendre";
  if (/\b(pause|stop|arrete|arreter|fatigue|fatiguee|demain|plus tard)\b/.test(t)) return "pause";
  if (/\b(pourquoi|comment|est ce que|cest quoi|quoi)\b/.test(t)) return "question";
  if (/\b(triste|content|contente|heureux|malade|ca va pas|jaime|merci|pardon)\b/.test(t))
    return "emotion";
  return "reponse";
}

/**
 * L'enseignant réfléchit : il comprend, réagit et réoriente.
 * Retourne null quand rien n'est disponible (on garde le déroulé normal).
 */
export async function think(args: {
  heard: HeardResult;
  expected?: string;
  situation?: string;
  learner?: string;
}): Promise<TutorReply | null> {
  const said = [args.heard.text, ...args.heard.alternatives].filter(Boolean)[0] ?? "";
  if (!said.trim()) return null;
  try {
    const res = await tutorTurn({
      data: {
        said,
        ...(args.expected ? { expected: args.expected } : {}),
        ...(args.situation ? { situation: args.situation } : {}),
        ...(args.learner ? { learner: args.learner } : {}),
        memory: memorySummary().slice(0, 1800),
      },
    });
    if (res?.ok) {
      const reply: TutorReply = {
        intent: (res.intent as Intent) ?? "reponse",
        correct: res.correct,
        reply: res.reply,
        mood: res.mood,
        note: res.note,
        next: (res.next as TutorReply["next"]) ?? "continuer",
      };
      if (reply.note) remember("note", reply.note);
      if (reply.mood) rememberMood(reply.mood);
      return reply;
    }
  } catch {
    /* hors connexion : on continue avec les règles simples */
  }
  const intent = localIntent(said);
  if (intent === "reponse") return null;
  return {
    intent,
    correct: null,
    reply:
      intent === "repeter"
        ? "Pas de problème, écoute-moi bien, je répète."
        : intent === "reprendre"
          ? "D'accord, on reprend tranquillement. On repart du début de cet exercice."
          : intent === "pause"
            ? "C'est bon, on se repose. Reviens quand tu veux, je t'attends."
            : intent === "emotion"
              ? "Je t'entends, mon ami. On avance ensemble, doucement."
              : "Bonne question. Écoute, je t'explique encore une fois.",
    mood: "calme",
    note: "",
    next: intent === "reprendre" ? "revenir_debut" : intent === "pause" ? "arreter" : "refaire",
  };
}
