import { useCallback, useEffect, useRef, useState } from "react";
import { Classroom, type Pose } from "./Classroom";
import { GuidedWriting } from "./GuidedWriting";
import { canListen, listenOnce, matchScore, normalize, playEncouragement, speak, stopSpeaking } from "@/lib/speech";
import { buildLesson, PRAISE, RETRY, type Activity } from "@/lib/curriculum";
import { ALPHABET, strokeAdvice } from "@/lib/letters";
import { recordAnswer, saveProfile, type Profile } from "@/lib/store";

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

/** Son débutant d'un morceau de syllabe (lettre) : « meunn », « aaa »… */
function soundForPart(part: string): string {
  const info = ALPHABET.find((l) => l.upper === part.toUpperCase());
  return info ? info.beginnerSound : part;
}

/** Un temps de la démonstration : l'enseignant parle et le tableau montre. */
type Step = { say: string; show: string; sub?: string; tap?: boolean; pose?: Pose };

function stepsFor(a: Activity): Step[] {
  switch (a.kind) {
    case "letter":
      return [
        {
          say: `Regarde bien le tableau. Ici, tu vois le son... ${a.sound}.`,
          show: a.upper,
          sub: `la grande lettre ${a.sound}`,
          tap: true,
        },
        {
          say: `Ici, c'est la petite forme. Elle fait aussi... ${a.sound}.`,
          show: a.lower,
          sub: `la petite lettre ${a.sound}`,
          tap: true,
        },
        {
          say: `La grande et la petite font le même son... ${a.sound}. ${a.example}.`,
          show: `${a.upper} ${a.lower}`,
          sub: a.example,
          tap: true,
        },
        {
          say: `Maintenant, à toi. Dis avec moi : ${a.sound}.`,
          show: `${a.upper} ${a.lower}`,
          sub: `répète : ${a.sound}`,
          pose: "listen",
        },
      ];
    case "syllable":
      return [
        { say: `Écoute. Ici j'ai ${a.parts[0]}.`, show: a.parts[0], tap: true },
        { say: `Et ici j'ai ${a.parts[1]}.`, show: a.parts[1], tap: true },
        {
          say: `${soundForPart(a.parts[0])}... ${soundForPart(a.parts[1])}... ${a.syllable}. Encore. ${soundForPart(a.parts[0])}... ${soundForPart(a.parts[1])}... ${a.syllable}.`,
          show: `${a.parts[0]} + ${a.parts[1]} = ${a.syllable}`,
          sub: "on colle les morceaux",
          tap: true,
        },
        {
          say: `À toi. Lis tout seul : ${a.syllable}.`,
          show: a.syllable,
          sub: `lis : ${a.syllable}`,
          pose: "listen",
        },
      ];
    case "word":
      return [
        {
          say: `Regarde ce mot. Je le coupe en morceaux : ${a.pieces.join(", ")}.`,
          show: a.pieces.join(" + "),
          tap: true,
        },
        {
          say: `Tout ensemble, ça fait ${a.word}. C'est ${a.hint}.`,
          show: a.word,
          sub: a.hint,
          tap: true,
        },
        { say: `À toi. Lis le mot : ${a.word}.`, show: a.word, sub: `lis : ${a.word}`, pose: "listen" },
      ];
    case "write":
      return [
        {
          say: `Maintenant on écrit ${a.target}. Regarde le trait vert : ${strokeAdvice(a.target)}`,
          show: a.target,
          sub: "regarde le sens du trait",
          tap: true,
        },
        {
          say: "À toi. Écris avec ton doigt, doucement, comme moi.",
          show: a.target,
          sub: "écris avec ton doigt",
          pose: "listen",
        },
      ];
    case "count":
      return [
        {
          say: "Comptons ensemble les choses sur le tableau.",
          show: "🟠".repeat(a.answer),
          tap: true,
        },
        {
          say: "Alors, combien de choses vois-tu ? Dis le nombre.",
          show: "🟠".repeat(a.answer),
          sub: "dis le nombre",
          pose: "listen",
        },
      ];
    case "money":
      return [
        { say: "Écoute bien cette histoire d'argent.", show: "💰", tap: true },
        { say: a.question, show: "💰", sub: a.question, pose: "listen" },
      ];
  }
}

function expectedSpoken(a: Activity): string {
  switch (a.kind) {
    case "letter": return a.sound;
    case "syllable": return a.syllable;
    case "word": return a.word;
    case "write": return a.target;
    case "count": return String(a.answer);
    case "money": return String(a.answer);
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
  const lesson = buildLesson(profile.day);
  const index = Math.min(Math.max(0, profile.activityIndex), lesson.activities.length - 1);
  const activity = lesson.activities[index] as Activity;
  const steps = stepsFor(activity);

  const [stepIndex, setStepIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "retry" | null>(null);
  const [typed, setTyped] = useState("");
  const [pose, setPose] = useState<Pose>("point");
  const [line, setLine] = useState(steps[0]?.say ?? "");
  const alive = useRef(true);
  const runId = useRef(0);

  const step = steps[Math.min(stepIndex, steps.length - 1)] as Step;
  const isAnswerStep = stepIndex >= steps.length - 1;

  const say = useCallback(async (text: string, p: Pose = "point") => {
    setLine(text);
    setPose(p);
    setSpeaking(true);
    await speak(text);
    if (alive.current) setSpeaking(false);
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopSpeaking();
    };
  }, []);

  // Enchaînement automatique : l'enseignant parle, montre, tape, puis passe.
  useEffect(() => {
    const id = ++runId.current;
    setStepIndex(0);
    setFeedback(null);
    setTyped("");
    let cancelled = false;

    (async () => {
      for (let i = 0; i < steps.length; i++) {
        if (cancelled || id !== runId.current) return;
        setStepIndex(i);
        const s = steps[i] as Step;
        await say(s.say, s.pose ?? "point");
        if (cancelled || id !== runId.current) return;
        if (i < steps.length - 1) await pause(450);
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

  async function judge(ok: boolean) {
    runId.current++; // stoppe la démonstration en cours
    const updated = recordAnswer(profile, activity.id, ok);
    persist(updated);
    setFeedback(ok ? "ok" : "retry");
    playEncouragement(ok);
    const msg = ok
      ? (PRAISE[Math.floor(Math.random() * PRAISE.length)] as string)
      : `Ça va aller. Écoute bien. C'est... ${expectedSpoken(activity)}. Maintenant, dis... ${expectedSpoken(activity)}.`;
    await say(msg, ok ? "happy" : "point");
    if (!ok) {
      await pause(300);
      if (!alive.current) return;
      setFeedback(null);
      setStepIndex(steps.length - 1);
      await say(steps[steps.length - 1]?.say ?? "", "listen");
      await answerBySpeech();
      return;
    }
    goNext(updated);
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
    persist({ ...base, activityIndex: index + 1, pendingSync: true });
  }

  async function answerBySpeech() {
    stopSpeaking();
    setSpeaking(false);
    setListening(true);
    setPose("listen");
    const said = await listenOnce(7000);
    if (!alive.current) return;
    setListening(false);
    if (!said) {
      await say(`Ce n'est pas grave. Écoute : ${expectedSpoken(activity)}. À toi maintenant.`, "listen");
      if (alive.current) await answerBySpeech();
      return;
    }
    check(said);
  }

  function check(said: string) {
    if (activity.kind === "count" || activity.kind === "money") {
      const value = parseNumber(said);
      void judge(value !== null && value === activity.answer);
      return;
    }
    void judge(matchScore(expectedSpoken(activity), said) >= 0.42);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-5">
      <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <span>🎯 Défi du jour {lesson.day}</span>
        <span>
          Exercice {index + 1} / {lesson.activities.length}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((index + 1) / lesson.activities.length) * 100}%` }}
        />
      </div>

      <Classroom
        line={line}
        pose={pose}
        speaking={speaking}
        onRepeat={() => void say(step.say, step.pose ?? "point")}
      >
        {activity.kind === "write" && isAnswerStep ? (
          <GuidedWriting target={activity.target} onResult={(ok) => void judge(ok)} />
        ) : (
          <div className="flex min-h-[190px] flex-col items-center justify-center gap-2">
            <p
              className={`font-display leading-none ${
                activity.kind === "count" ? "text-4xl" : "text-6xl"
              } ${step.tap && speaking ? "animate-pulse-soft" : ""}`}
            >
              {step.show}
            </p>
            {step.sub ? <p className="text-lg text-white/80">{step.sub}</p> : null}
            {feedback === "ok" ? <p className="text-3xl">🎉 ⭐</p> : null}
          </div>
        )}
      </Classroom>

      {/* Sous-titres : ce que l'enseignant est en train de dire */}
      <div className="rounded-2xl bg-card p-4 shadow-warm">
        <p className="text-xs font-bold tracking-widest text-muted-foreground">SOUS-TITRES</p>
        <p className="mt-1 text-xl leading-snug font-semibold text-card-foreground">{line}</p>
      </div>

      {activity.kind !== "write" || !isAnswerStep ? (
        <div className="space-y-3">
          {canListen() ? (
            <button
              onClick={answerBySpeech}
              className="w-full rounded-3xl bg-primary px-6 py-8 text-2xl font-bold text-primary-foreground shadow-warm"
            >
              {listening ? "🎙️ Je t'écoute…" : "👄 À moi de parler"}
            </button>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) check(typed);
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
