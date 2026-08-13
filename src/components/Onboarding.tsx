import { useEffect, useRef, useState } from "react";
import { Teacher } from "./Teacher";
import { canListen, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { emptyProfile, saveProfile, type Profile } from "@/lib/store";

type Step = "name" | "city" | "phone" | "done";

const QUESTIONS: Record<Exclude<Step, "done">, string> = {
  name: "Bonjour. Je vais t'aider à apprendre à lire, à écrire et à compter. Comment tu t'appelles ?",
  city: "Dans quelle ville tu habites ?",
  phone: "Quel est ton numéro de téléphone ?",
};

function cleanName(said: string) {
  return said
    .replace(/^(je m'appelle|je mappelle|moi c'est|c'est|mon nom est)\s*/i, "")
    .replace(/\.$/, "")
    .trim();
}

export function Onboarding({ onReady }: { onReady: (p: Profile) => void }) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Profile>(() => emptyProfile());
  const [line, setLine] = useState(QUESTIONS.name);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [typed, setTyped] = useState("");
  const spoken = useRef<string>("");

  useEffect(() => {
    if (step === "done") return;
    const question = QUESTIONS[step];
    setLine(question);
    setTyped("");
    if (spoken.current === question) return;
    spoken.current = question;
    setSpeaking(true);
    speak(question).then(() => setSpeaking(false));
  }, [step]);

  useEffect(() => () => stopSpeaking(), []);

  function commit(value: string) {
    const v = value.trim();
    if (!v) return;
    let next: Profile = draft;
    if (step === "name") next = { ...draft, name: cleanName(v), pendingSync: true };
    if (step === "city") next = { ...draft, city: v, pendingSync: true };
    if (step === "phone") next = { ...draft, phone: v, pendingSync: true };
    setDraft(next);
    saveProfile(next); // la conversation EST l'inscription : on sauvegarde tout de suite

    if (step === "name") {
      setSpeaking(true);
      speak(`Très bien ${next.name}.`).then(() => setSpeaking(false));
      setStep("city");
    } else if (step === "city") {
      setStep("phone");
    } else {
      setStep("done");
      setSpeaking(true);
      speak(
        `Merci ${next.name}. On commence tout de suite. Écoute bien, et répète après moi.`,
      ).then(() => {
        setSpeaking(false);
        onReady(next);
      });
      setTimeout(() => onReady(next), 5000);
    }
  }

  async function talk() {
    stopSpeaking();
    setListening(true);
    const said = await listenOnce(7000);
    setListening(false);
    if (said) commit(said);
    else {
      setSpeaking(true);
      await speak("Je n'ai pas bien entendu. Parle encore une fois, s'il te plaît.");
      setSpeaking(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <Teacher
        line={line}
        speaking={speaking}
        onRepeat={() => {
          setSpeaking(true);
          speak(line).then(() => setSpeaking(false));
        }}
      />

      {step !== "done" ? (
        <div className="space-y-4">
          {canListen() ? (
            <button
              onClick={talk}
              className="w-full rounded-3xl bg-primary px-6 py-8 text-2xl font-bold text-primary-foreground shadow-warm"
            >
              {listening ? "🎙️ Je t'écoute…" : "🎙️ Parler"}
            </button>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              commit(typed);
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
