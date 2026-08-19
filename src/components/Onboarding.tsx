import { useCallback, useEffect, useRef, useState } from "react";
import { Classroom } from "./Classroom";
import { canListen, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { emptyProfile, saveProfile, type Profile } from "@/lib/store";

type Step = "name" | "city" | "phone" | "gender" | "done";

function cleanName(said: string) {
  return said
    .replace(/^(je m'appelle|je mappelle|moi c'est|c'est|mon nom est)\s*/i, "")
    .replace(/\.$/, "")
    .trim();
}

function questionFor(step: Exclude<Step, "done">, name: string) {
  if (step === "name") return "Bonjour ! Moi, c'est ton enseignant. Comment tu t'appelles ? Dis-moi seulement ton prénom.";
  if (step === "city") return `D'accord ${name}. Dans quelle ville tu habites ?`;
  if (step === "phone") return "Très bien. Dis-moi maintenant ton numéro de téléphone, doucement.";
  return `Dis-moi ${name}, tu es un garçon ou une fille ?`;
}

export function Onboarding({ onReady }: { onReady: (p: Profile) => void }) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Profile>(() => emptyProfile());
  const [line, setLine] = useState("Bonjour ! Moi, c'est ton enseignant.");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const alive = useRef(true);
  const started = useRef(false);

  const say = useCallback(async (text: string) => {
    setLine(text);
    setListening(false);
    setSpeaking(true);
    await speak(text);
    if (alive.current) setSpeaking(false);
  }, []);

  const finish = useCallback(async (profile: Profile) => {
    setStep("done");
    await say(`Merci ${profile.name}. À partir de maintenant, regarde et écoute seulement. Je vais te guider pas à pas.`);
    if (alive.current) onReady(profile);
  }, [onReady, say]);

  const runConversation = useCallback(async (first: Step, initial: Profile) => {
    let current = first;
    let profile = initial;
    while (alive.current && current !== "done") {
      await say(questionFor(current, profile.name));
      if (!alive.current) return;
      setListening(true);
      const heard = canListen() ? await listenOnce(10000) : "";
      setListening(false);
      if (!heard.trim()) {
        await say("Ce n'est pas grave. Je remets mon oreille. Parle maintenant, doucement.");
        continue;
      }

      if (current === "name") {
        const name = cleanName(heard);
        if (!name) continue;
        profile = { ...profile, name, pendingSync: true };
        current = "city";
      } else if (current === "city") {
        profile = { ...profile, city: heard.trim(), pendingSync: true };
        current = "phone";
      } else if (current === "phone") {
        profile = { ...profile, phone: heard.trim(), pendingSync: true };
        current = "gender";
      } else {
        const normalized = heard.toLowerCase();
        if (!normalized.includes("garçon") && !normalized.includes("garcon") && !normalized.includes("homme") && !normalized.includes("fille") && !normalized.includes("femme")) {
          await say("Dis seulement garçon, ou fille.");
          continue;
        }
        profile = {
          ...profile,
          gender: normalized.includes("fille") || normalized.includes("femme") ? "fille" : "garcon",
          pendingSync: true,
        };
        current = "done";
      }
      setDraft(profile);
      setStep(current);
      saveProfile(profile);
    }
    if (current === "done") await finish(profile);
  }, [finish, say]);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setNeedsUnlock(false);
    void runConversation("name", draft);
  }, [draft, runConversation]);

  useEffect(() => {
    alive.current = true;
    // On essaie immédiatement. Si le téléphone bloque la voix avant un geste,
    // toute la scène devient l'unique grande zone de démarrage.
    const timer = setTimeout(() => {
      start();
      setTimeout(() => {
        if (!window.speechSynthesis?.speaking && step === "name") setNeedsUnlock(true);
      }, 350);
    }, 200);
    return () => {
      alive.current = false;
      clearTimeout(timer);
      stopSpeaking();
    };
  }, []); // démarrage unique

  return (
    <button
      type="button"
      onClick={needsUnlock ? () => { started.current = false; start(); } : undefined}
      className="mx-auto block min-h-[calc(100vh-4rem)] w-full max-w-xl space-y-5 bg-background px-4 py-6 text-left"
      aria-label={needsUnlock ? "Toucher pour démarrer la voix" : "Conversation vocale automatique"}
    >
      <Classroom line={line} pose={listening ? "listen" : speaking ? "point" : "happy"} speaking={speaking}>
        <div className="flex min-h-[190px] items-center justify-center">
          <span className={`text-7xl ${listening ? "animate-pulse-soft" : ""}`} aria-hidden="true">
            {needsUnlock ? "👆" : listening ? "🎙️" : speaking ? "🗣️" : "🙂"}
          </span>
        </div>
      </Classroom>
      <div className="rounded-2xl bg-card p-4 text-center shadow-warm" aria-live="polite">
        <p className="text-xl leading-snug font-semibold text-card-foreground">{line}</p>
      </div>
      <div className="flex justify-center gap-3 text-3xl" aria-hidden="true">
        <span className={speaking ? "animate-pulse-soft" : "opacity-30"}>👨🏾‍🏫</span>
        <span>➡️</span>
        <span className={listening ? "animate-pulse-soft" : "opacity-30"}>🎙️</span>
      </div>
    </button>
  );
}