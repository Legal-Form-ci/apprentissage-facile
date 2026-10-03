import { useCallback, useEffect, useRef, useState } from "react";\nimport { ArrowLeft, Volume2 } from "lucide-react";
import { Classroom, type Pose } from "./Classroom";
import { GuidedWriting } from "./GuidedWriting";
import {
  bestScore,
  canListen,
  listenOnce,
  matchScore,
  normalize,
  playEncouragement,
  speak,
  stopSpeaking,
  type HeardResult,
} from "@/lib/speech";
import { buildLesson, levelOf, PRAISE, type Activity } from "@/lib/curriculum";
import { strokeAdvice } from "@/lib/letters";
import { startNoiseWatch, stopNoiseWatch } from "@/lib/noise";
import { hardestSkills, remember } from "@/lib/memory";
import { think } from "@/lib/tutor";
import { dueSkillIds, recordAnswer, saveProfile, type Profile } from "@/lib/store";

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10,
};

function parseNumber(said: string): number | null {
  const t = normalize(said).replace(/francs?/g, " ");
  const digits = t.replace(/\s/g, "").match(/\d+/g);
  if (digits && digits[0]) return Number(digits.join(""));
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (t.includes(word)) return value;
  }
  return null;
}

/** Un temps de la démonstration : l'enseignant parle et le tableau montre. */
type Step = { say: string; show: string; sub?: string; tap?: boolean; pose?: Pose };

function stepsFor(a: Activity): Step[] {
  switch (a.kind) {
    case "oral":
      return [
        { say: a.prompt, show: a.visual, pose: "listen" },
      ];
    case "letter":
      return [
        { say: `Voici la lettre ${a.upper}. Écoute le mot repère : ${a.example}.`, show: a.upper, tap: true },
        { say: `Voici la petite forme : ${a.lower}.`, show: a.lower, tap: true },
        { say: "À toi. Dis le nom de la lettre.", show: a.upper, pose: "listen" },
      ];
    case "syllable":
      return [
        { say: `Regarde : ${a.parts[0]}.`, show: a.parts[0], tap: true },
        { say: `Regarde : ${a.parts[1]}.`, show: a.parts[1], tap: true },
        { say: `Je les assemble : ${a.syllable}.`, show: a.syllable, tap: true },
        { say: `À toi. Lis : ${a.syllable}.`, show: a.syllable, pose: "listen" },
      ];
    case "word":
      return [
        {
          say: `Regarde ce mot. Je le coupe en morceaux : ${a.pieces.join(", ")}.`,
          show: a.pieces.join(" + "),
          tap: true,
        },
        { say: `Tout ensemble, ça fait ${a.word}. C'est ${a.hint}.`, show: a.word, tap: true },
        { say: `À toi. Lis le mot : ${a.word}.`, show: a.word, pose: "listen" },
      ];
    case "read":
      return [
        {
          say: "Regarde bien le tableau. Il y a quelque chose à lire aujourd'hui.",
          show: a.text,
          tap: true,
        },
        {
          say: `À toi maintenant : ${a.hint}. Je t'écoute et je te donne une note.`,
          show: a.text,
          pose: "listen",
        },
      ];
    case "dictation":
      return [
        {
          say: "On va faire une dictée. Écoute bien, je ne montre rien au tableau.",
          show: "✍️",
          tap: true,
        },
        {
          say: `Écris ce que je dis. ${a.text}. Je répète : ${a.text}. Tu as le temps, écris, puis touche « J'ai fini ».`,
          show: "✍️",
          pose: "listen",
        },
      ];
    case "write":
      return [
        {
          say: `Maintenant on écrit ${a.target}. Regarde le trait vert : ${strokeAdvice(a.target)}`,
          show: a.target,
          tap: true,
        },
        {
          say: "À toi. Écris avec ton doigt, doucement, comme moi.",
          show: a.target,
          pose: "listen",
        },
      ];
    case "count":
      return [
        { say: "Comptons ensemble les choses sur le tableau.", show: "🟠".repeat(a.answer), tap: true },
        {
          say: "Alors, combien de choses vois-tu ? Dis le nombre.",
          show: "🟠".repeat(a.answer),
          pose: "listen",
        },
      ];
    case "money":
      return [
        { say: "Écoute bien cette histoire d'argent.", show: "💰", tap: true },
        { say: a.question, show: "💰", pose: "listen" },
      ];
    default:
      return [{ say: "On continue.", show: "•", pose: "listen" }];
  }
}

function expectedSpoken(a: Activity): string {
  switch (a.kind) {
    case "oral": return a.expected;
    case "letter": return a.name;
    case "syllable": return a.syllable;
    case "word": return a.word;
    case "read": return a.text;
    case "dictation": return a.text;
    case "write": return a.target;
    case "count": return String(a.answer);
    case "money": return String(a.answer);
    default: return "";
  }
}

export function DailySession({
  profile,
  setProfile,
  onFinish,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onFinish: () => void;
}) {
  const level = levelOf(profile.day);
  const reviewIds = [...dueSkillIds(profile, 3), ...hardestSkills(3)];
  const lesson = buildLesson(profile.day, [...new Set(reviewIds)].slice(0, 4));
  const index = Math.min(Math.max(0, profile.activityIndex), lesson.activities.length - 1);
  const activity = lesson.activities[index] as Activity;
  const steps = stepsFor(activity);

  const [stepIndex, setStepIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "retry" | null>(null);
  const [typed, setTyped] = useState("");
  const [heardText, setHeardText] = useState("");
  const [pose, setPose] = useState<Pose>("point");
  const [line, setLine] = useState(steps[0]?.say ?? "");
  const [left, setLeft] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const alive = useRef(true);
  const runId = useRef(0);

  const step = steps[Math.min(stepIndex, steps.length - 1)] as Step;
  const isAnswerStep = stepIndex >= steps.length - 1;
  const isDictation = activity.kind === "dictation";

  const say = useCallback(async (text: string, p: Pose = "point") => {
    setLine(text);
    setPose(p);
    setSpeaking(true);
    await speak(text);
    if (alive.current) setSpeaking(false);
  }, []);

  useEffect(() => {
    alive.current = true;
    // Surveillance automatique du bruit pendant toute la séance
    startNoiseWatch();
    return () => {
      alive.current = false;
      stopNoiseWatch();
      stopSpeaking();
    };
  }, []);

  // Compte à rebours de la dictée : à zéro, le champ se grise.
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) {
      setLocked(true);
      return;
    }
    const t = setTimeout(() => setLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // Correction automatique dès que le temps est écoulé
  useEffect(() => {
    if (locked && isDictation) void gradeDictation(typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  // Enchaînement automatique : l'enseignant parle, montre, tape, puis passe.
  useEffect(() => {
    const id = ++runId.current;
    setStepIndex(0);
    setFeedback(null);
    setTyped("");
    setHeardText("");
    setLeft(null);
    setLocked(false);
    let cancelled = false;

    (async () => {
      const stop = () => cancelled || id !== runId.current;
      for (let i = 0; i < steps.length - 1; i++) {
        if (stop()) return;
        setStepIndex(i);
        const s = steps[i] as Step;
        await say(s.say, s.pose ?? "point");
        if (stop()) return;
        await pause(400);
      }
      if (stop()) return;
      setStepIndex(steps.length - 1);
      const last = steps[steps.length - 1] as Step;
      await say(last.say, last.pose ?? "listen");
      if (stop()) return;
      if (isDictation) {
        setLeft(activity.kind === "dictation" ? activity.seconds : 60);
        return;
      }
      if (activity.kind !== "write" && canListen()) {
        await pause(250);
        if (stop()) return;
        await answerBySpeech();
      }
    })();

    return () => {
      cancelled = true;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  function persist(next: Profile) {
    saveProfile(next);
    setProfile(next);
  }

  async function judge(ok: boolean, score = ok ? 1 : 0) {
    runId.current++; // stoppe la démonstration en cours
    const updated = recordAnswer(profile, activity.id, ok, score);
    persist(updated);
    setFeedback(ok ? "ok" : "retry");
    playEncouragement(ok);
    if (ok) {
      remember("reussite", `${activity.id} réussi`);
    } else {
      // mémorisation des sons difficiles pour la révision automatique
      remember("echec", `${activity.id} difficile`, `difficile:${activity.id}`);
    }
    const msg = ok
      ? (PRAISE[Math.floor(Math.random() * PRAISE.length)] as string)
      : "Ce n'est pas grave. Écoute encore une fois, puis essaie.";

    await say(msg, ok ? "happy" : "point");
    if (!ok) {
      await pause(400);
      if (!alive.current) return;
      setFeedback(null);
      setStepIndex(steps.length - 1);
      await say(steps[steps.length - 1]?.say ?? "", "listen");
      if (canListen() && !isDictation) await answerBySpeech();
      return;
    }
    if (activity.kind !== "read" && activity.kind !== "dictation" && activity.kind !== "count" && activity.kind !== "money") {
      await refinePronunciation(score);
    }
    if (!alive.current) return;
    goNext(updated);
  }

  /** Note verbale sur 10 : l'enseignant donne une note et encourage. */
  async function gradeOutOfTen(score: number) {
    const note = Math.max(0, Math.min(10, Math.round(score * 10)));
    const updated = recordAnswer(profile, activity.id, note >= 5, score);
    persist(updated);
    playEncouragement(note >= 5);
    setFeedback(note >= 5 ? "ok" : "retry");
    if (note < 5) remember("echec", `${activity.id} difficile`, `difficile:${activity.id}`);
    await say(
      note >= 8
        ? `Excellent ! Je te donne ${note} sur 10. Tu lis bien maintenant.`
        : note >= 5
          ? `C'est bien. Je te mets ${note} sur 10. Encore un petit effort et c'est parfait.`
          : `Je te mets ${note} sur 10. Ce n'est pas grave du tout, on va y arriver ensemble. Écoute-moi : ${expectedSpoken(activity)}.`,
      note >= 5 ? "happy" : "point",
    );
    if (!alive.current) return;
    goNext(updated);
  }

  async function gradeDictation(written: string) {
    runId.current++;
    const score = matchScore(expectedSpoken(activity), written);
    await say("Le temps est fini. Je regarde ton écriture.", "point");
    if (!alive.current) return;
    await gradeOutOfTen(score);
  }

  function goNext(base: Profile) {
    const isLast = index >= lesson.activities.length - 1;
    if (isLast) {
      const session = {
        date: new Date().toISOString(),
        day: base.day,
        activities: lesson.activities.length,
        success: base.stars,
      };
      const done: Profile = {
        ...base,
        day: base.day + 1,
        activityIndex: 0,
        sessions: [...base.sessions, session],
        certificates:
          base.day % 30 === 0
            ? [...base.certificates, { level: Math.ceil(base.day / 30), date: session.date }]
            : base.certificates,
        pendingSync: true,
      };
      persist(done);
      onFinish();
      return;
    }
    // reprise exacte : l'avancement est enregistré tout de suite sur le téléphone
    persist({ ...base, activityIndex: index + 1, lastActivityId: activity.id, pendingSync: true });
  }

  /** Écoute la réponse, avec relance douce quand l'apprenant hésite. */
  async function answerBySpeech(tries = 0) {
    stopSpeaking();
    setSpeaking(false);
    setListening(true);
    setPose("listen");
    const said = await listenOnce(60000);
    if (!alive.current) return;
    setListening(false);
    setHeardText([said.text, ...said.alternatives].filter(Boolean).join(" · "));
    if (!said.text.trim()) {
      await pause(700);
      if (!alive.current) return;
        await say(tries === 0 ? "Je t'écoute. Prends ton temps." : "Prends ton temps. Essaie encore.", "listen");
      if (alive.current) await answerBySpeech(tries + 1);
      return;
    }
    await check(said);
  }

  /** Prononciation guidée : on refait dire uniquement ce qui est difficile. */
  async function refinePronunciation(score: number) {
    if (score >= 0.75 || !canListen()) return;
    await say("On essaie encore une fois. Écoute bien.", "listen");
    if (!alive.current) return;
    setListening(true);
    const again = await listenOnce(30000);
    setListening(false);
    if (!alive.current) return;
    setHeardText([again.text, ...again.alternatives].filter(Boolean).join(" · "));
    const next = bestScore(expectedSpoken(activity), again);
    await say(
      next > score
        ? "Voilà ! C'est beaucoup mieux. Ta bouche a bien travaillé."
        : "Ce n'est pas grave. On va reprendre tranquillement.",
      next > score ? "happy" : "point",
    );
  }

  async function check(said: HeardResult) {
    if (activity.kind === "count" || activity.kind === "money") {
      const value = parseNumber(said.text);
      if (value !== null && value === activity.answer) {
        await judge(true, 1);
        return;
      }
      await reactOrJudge(said, 0);
      return;
    }
    const score = bestScore(expectedSpoken(activity), said);
    // Lecture : note verbale sur 10 au lieu d'un simple juste/faux
    if (activity.kind === "read") {
      await gradeOutOfTen(score);
      return;
    }
    if (score >= 0.42) {
      await judge(true, score);
      return;
    }
    await reactOrJudge(said, score);
  }

  /**
   * Quand la réponse n'est pas celle attendue, l'enseignant réfléchit :
   * demande de répéter, de reprendre, une émotion, une pause…
   */
  async function reactOrJudge(said: HeardResult, score: number) {
    const reply = await think({
      heard: said,
      expected: expectedSpoken(activity),
      situation: `Exercice ${activity.kind} du jour ${lesson.day}. L'apprenant est débutant en alphabétisation et peut ne pas lire les textes affichés.`,
      ...(profile.name ? { learner: profile.name } : {}),
    });
    if (!alive.current) return;
    if (reply && reply.intent !== "reponse") {
      await say(reply.reply, reply.next === "continuer" ? "happy" : "point");
      if (!alive.current) return;
      if (reply.next === "arreter") {
        onFinish();
        return;
      }
      if (reply.next === "revenir_debut") {
        setStepIndex(0);
        await say(steps[0]?.say ?? "", "point");
      } else {
        setStepIndex(steps.length - 1);
        await say(steps[steps.length - 1]?.say ?? "", "listen");
      }
      if (alive.current && canListen() && !isDictation) await answerBySpeech();
      return;
    }
    await judge(false, score);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-2 sm:px-6">
      <header className="session-topbar">
        <button type="button" className="icon-button" onClick={() => onExit?.()} aria-label="Quitter la séance"><ArrowLeft size={21} /></button>
        <div className="session-brand"><img src="/logo.png" alt="" /><span>Apprentissage</span></div>
        <button type="button" className="icon-button" onClick={() => void say(line, pose)} aria-label="Réécouter"><Volume2 size={20} /></button>
      </header>
      <div className="session-progress-head">
        <span>SÉANCE</span>
        <strong>{index + 1} / {lesson.activities.length}</strong>
      </div>
      <div className="session-progress-track">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((index + 1) / lesson.activities.length) * 100}%` }}
        />
      </div>

      <Classroom
        line={line}
        pose={pose}
        speaking={speaking}
        showTranscript={level >= 3}
        onRepeat={() => void say(step.say, step.pose ?? "point")}
      >
        {activity.kind === "write" && isAnswerStep ? (
          <GuidedWriting target={activity.target} onResult={(ok) => void judge(ok)} />
        ) : (
          <div className="flex min-h-[190px] flex-col items-center justify-center gap-2">
            <p
              className={`font-display leading-tight ${
                activity.kind === "read"
                  ? "text-3xl"
                  : activity.kind === "count"
                    ? "text-4xl"
                    : "text-6xl"
              } ${step.tap && speaking ? "animate-pulse-soft" : ""}`}
            >
              {step.show}
            </p>
            {feedback === "ok" ? <p className="text-3xl">🎉 ⭐</p> : null}
          </div>
        )}
      </Classroom>

      {/* La transcription brute n'est utile qu'après les premiers niveaux : au début, elle ajoute du texte inutile. */}
      {heardText && level >= 3 ? (
        <div className="rounded-2xl bg-secondary p-3" aria-live="polite">
          <p className="text-xs font-bold tracking-widest text-secondary-foreground/70">
            CE QUE J'AI ENTENDU
          </p>
          <p className="text-lg font-semibold text-secondary-foreground">{heardText}</p>
        </div>
      ) : null}

      {/* Dictée : champ de saisie, compte à rebours, puis champ grisé */}
      {isDictation && isAnswerStep ? (
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-warm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-widest text-muted-foreground">MA DICTÉE</p>
            <p className="text-xl font-bold text-primary">
              ⏳ {left !== null ? `${left} s` : "—"}
            </p>
          </div>
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={locked}
            className="h-28 w-full rounded-2xl border-2 border-border bg-background p-3 text-xl disabled:opacity-60"
          />
          <button
            onClick={() => {
              setLocked(true);
              setLeft(0);
            }}
            disabled={locked}
            className="w-full rounded-3xl bg-primary px-6 py-6 text-2xl font-bold text-primary-foreground shadow-warm disabled:opacity-60"
          >
            ✅ J'ai fini
          </button>
        </div>
      ) : null}

      {!isDictation && (activity.kind !== "write" || !isAnswerStep) ? (
        <div className="space-y-3">
          {canListen() ? (
            <button
              onClick={() => void answerBySpeech()}
              className="w-full rounded-3xl bg-primary px-6 py-8 text-2xl font-bold text-primary-foreground shadow-warm"
            >
              {listening ? "🎙️ Je t'écoute…" : "👄 À moi de parler"}
            </button>
          ) : null}
          {/* Le clavier n'apparaît qu'à partir du niveau 3 : avant, tout est vocal. */}
          {level >= 3 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim()) void check({ text: typed, alternatives: [], voiced: true });
              }}
              className="flex gap-2"
            >
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="… ou écris ta réponse"
                className="flex-1 rounded-2xl border-2 border-border bg-card px-4 py-4 text-xl text-card-foreground outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-2xl bg-accent px-5 py-4 text-xl font-bold text-accent-foreground"
              >
                ➜
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <button
        onClick={() => goNext(profile)}
        className="w-full rounded-2xl bg-secondary px-4 py-4 text-lg font-semibold text-secondary-foreground"
      >
        ⏭️ Passer
      </button>
    </div>
  );
}

function pause(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
