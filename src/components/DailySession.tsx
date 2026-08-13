import { useCallback, useEffect, useRef, useState } from "react";
import { Teacher } from "./Teacher";
import { WritingCanvas } from "./WritingCanvas";
import { canListen, listenOnce, matchScore, normalize, speak, stopSpeaking } from "@/lib/speech";
import { buildLesson, PRAISE, RETRY, type Activity } from "@/lib/curriculum";
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

function instruction(a: Activity): { line: string; big: string; sub?: string } {
  switch (a.kind) {
    case "letter":
      return { line: `Regarde cette lettre. Elle se lit ${a.sound}. Écoute, puis répète : ${a.letter}.`, big: a.letter, sub: `se dit « ${a.sound} »` };
    case "syllable":
      return {
        line: `${a.parts[0]} et ${a.parts[1]} font ${a.syllable}. Colle les deux morceaux, puis lis tout seul.`,
        big: `${a.parts[0]} + ${a.parts[1]} = ${a.syllable}`,
        sub: "Lis à voix haute",
      };
    case "word":
      return {
        line: `Colle les morceaux et lis le mot : ${a.word}. C'est ${a.hint}.`,
        big: a.pieces.join(" + ") + " = " + a.word,
        sub: a.hint,
      };
    case "write":
      return { line: `Regarde comment on écrit ${a.target}. Maintenant, c'est ton tour. Écris avec ton doigt.`, big: a.target };
    case "count":
      return { line: "Compte avec moi. Combien de choses vois-tu ?", big: "🟠".repeat(a.answer) };
    case "money":
      return { line: a.question, big: "💰", sub: a.question };
  }
}

function expectedSpoken(a: Activity): string {
  switch (a.kind) {
    case "letter": return a.letter;
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
  const index = Math.min(profile.activityIndex, lesson.activities.length - 1);
  const activity = lesson.activities[index] as Activity;
  const info = instruction(activity);

  const [line, setLine] = useState(info.line);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "retry" | null>(null);
  const [typed, setTyped] = useState("");
  const lastSpoken = useRef("");

  const say = useCallback(async (text: string) => {
    setLine(text);
    setSpeaking(true);
    await speak(text);
    setSpeaking(false);
  }, []);

  useEffect(() => {
    setFeedback(null);
    setTyped("");
    if (lastSpoken.current === activity.id) return;
    lastSpoken.current = activity.id;
    say(info.line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  useEffect(() => () => stopSpeaking(), []);

  function persist(next: Profile) {
    saveProfile(next);
    setProfile(next);
  }

  async function judge(ok: boolean) {
    const updated = recordAnswer(profile, activity.id, ok);
    persist(updated);
    setFeedback(ok ? "ok" : "retry");
    const msg = ok
      ? (PRAISE[Math.floor(Math.random() * PRAISE.length)] as string)
      : (RETRY[Math.floor(Math.random() * RETRY.length)] as string);
    await say(msg);
    if (!ok) {
      await say(`Écoute bien : ${expectedSpoken(activity)}.`);
      setFeedback(null);
      lastSpoken.current = "";
      await say(info.line);
      return;
    }
    next(updated);
  }

  function next(base: Profile) {
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
    persist({ ...base, activityIndex: index + 1, pendingSync: true });
  }

  async function answerBySpeech() {
    stopSpeaking();
    setListening(true);
    const said = await listenOnce(7000);
    setListening(false);
    if (!said) {
      await say("Je n'ai pas bien entendu. Parle encore une fois.");
      return;
    }
    check(said);
  }

  function check(said: string) {
    if (activity.kind === "count" || activity.kind === "money") {
      const value = parseNumber(said);
      judge(value !== null && value === activity.answer);
      return;
    }
    judge(matchScore(expectedSpoken(activity), said) >= 0.6);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-6">
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

      <Teacher line={line} speaking={speaking} onRepeat={() => say(line)} />

      <div className="rounded-3xl bg-card p-6 text-center shadow-warm">
        <p
          className={`font-display leading-none text-card-foreground ${
            activity.kind === "count" ? "text-4xl" : activity.kind === "money" ? "text-6xl" : "text-5xl"
          }`}
        >
          {activity.kind === "write" ? null : info.big}
        </p>
        {activity.kind === "write" ? (
          <WritingCanvas target={activity.target} onResult={judge} />
        ) : null}
        {info.sub && activity.kind !== "money" ? (
          <p className="mt-3 text-lg text-muted-foreground">{info.sub}</p>
        ) : null}
        {feedback === "ok" ? <p className="mt-4 text-3xl">🎉 ⭐</p> : null}
      </div>

      {activity.kind !== "write" ? (
        <div className="space-y-3">
          {canListen() ? (
            <button
              onClick={answerBySpeech}
              className="w-full rounded-3xl bg-primary px-6 py-8 text-2xl font-bold text-primary-foreground shadow-warm"
            >
              {listening ? "🎙️ Je t'écoute…" : "👄 Parler"}
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
        onClick={() => next(profile)}
        className="w-full rounded-2xl bg-secondary px-4 py-4 text-lg font-semibold text-secondary-foreground"
      >
        ⏭️ Passer
      </button>
    </div>
  );
}
