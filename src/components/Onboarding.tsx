import { useCallback, useEffect, useRef, useState } from "react";
import { Classroom } from "./Classroom";
import { canListen, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { emptyProfile, saveProfile, type Profile } from "@/lib/store";

type Step = "tap" | "name" | "city" | "phone" | "done";

const QUESTIONS: Record<"name" | "city" | "phone", string> = {
  name: "Bonjour ! Je suis ton enseignant. Je vais t'aider à apprendre à lire, à écrire et à compter. Dis-moi, comment tu t'appelles ?",
  city: "Très bien. Dans quelle ville tu habites ?",
  phone: "Merci. Quel est ton numéro de téléphone ?",
};

function cleanName(said: string) {
  return said
    .replace(/^(je m'appelle|je mappelle|moi c'est|c'est|mon nom est)\s*/i, "")
    .replace(/\.$/, "")
    .trim();
}

export function Onboarding({ onReady }: { onReady: (p: Profile) => void }) {
  const [step, setStep] = useState<Step>("tap");
  const [draft, setDraft] = useState<Profile>(() => emptyProfile());
  const [line, setLine] = useState(
    "Appuie sur le grand bouton : je te parle et tu n'as qu'à suivre.",
  );
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [typed, setTyped] = useState("");
  const alive = useRef(true);

  const say = useCallback(async (text: string) => {
    setLine(text);
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

  /** Pose la question, puis écoute tout seul. */
  const ask = useCallback(
    async (s: "name" | "city" | "phone") => {
      setStep(s);
      setTyped("");
      await say(QUESTIONS[s]);
      if (!alive.current) return;
      if (canListen()) await listenNow(s);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [say],
  );

  async function listenNow(s: "name" | "city" | "phone") {
    stopSpeaking();
    setListening(true);
    const said = await listenOnce(8000);
    if (!alive.current) return;
    setListening(false);
    if (said) void commit(said, s);
    else await say("Je n'ai pas bien entendu. Appuie sur le micro et parle encore une fois.");
  }

  async function commit(value: string, s: "name" | "city" | "phone") {
    const v = value.trim();
    if (!v) return;
    let next: Profile = draft;
    if (s === "name") next = { ...draft, name: cleanName(v), pendingSync: true };
    if (s === "city") next = { ...draft, city: v, pendingSync: true };
    if (s === "phone") next = { ...draft, phone: v, pendingSync: true };
    setDraft(next);
    saveProfile(next); // la conversation EST l'inscription

    if (s === "name") {
      await say(`Très bien ${next.name}. Enchanté !`);
      if (alive.current) void ask("city");
    } else if (s === "city") {
      void ask("phone");
    } else {
      setStep("done");
      await say(
        `Merci ${next.name}. On commence tout de suite. Écoute bien, regarde le tableau, et répète après moi.`,
      );
      onReady(next);
    }
  }

  if (step === "tap") {
    return (
      <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-8">
        <Classroom line={line} pose="happy" speaking={false}>
          <div className="flex min-h-[190px] items-center justify-center">
            <p className="font-display text-5xl">👋</p>
          </div>
        </Classroom>
        <Subtitles line={line} />
        <button
          onClick={() => void ask("name")}
          className="w-full rounded-3xl bg-primary px-6 py-12 text-3xl font-bold text-primary-foreground shadow-warm"
        >
          👆 Appuie ici, je te parle
        </button>
      </div>
    );
  }

  const current = step === "done" ? "phone" : (step as "name" | "city" | "phone");

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-6">
      <Classroom
        line={line}
        pose={listening ? "listen" : speaking ? "point" : "happy"}
        speaking={speaking}
        onRepeat={() => void say(line)}
      >
        <div className="flex min-h-[190px] items-center justify-center">
          <p className="font-display text-4xl">{listening ? "🎙️" : "🗣️"}</p>
        </div>
      </Classroom>

      <Subtitles line={line} />

      {step !== "done" ? (
        <div className="space-y-3">
          {canListen() ? (
            <button
              onClick={() => void listenNow(current)}
              className="w-full rounded-3xl bg-primary px-6 py-8 text-2xl font-bold text-primary-foreground shadow-warm"
            >
              {listening ? "🎙️ Je t'écoute…" : "🎙️ Parler"}
            </button>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void commit(typed, current);
            }}
            className="flex gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              inputMode={step === "phone" ? "tel" : "text"}
              placeholder="… ou écris ici"
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
      ) : (
        <p className="text-center text-lg text-muted-foreground">Un instant…</p>
      )}
    </div>
  );
}

function Subtitles({ line }: { line: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-warm">
      <p className="text-xs font-bold tracking-widest text-muted-foreground">SOUS-TITRES</p>
      <p className="mt-1 text-xl leading-snug font-semibold text-card-foreground">{line}</p>
    </div>
  );
}
