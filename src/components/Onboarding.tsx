import { useCallback, useEffect, useRef, useState } from "react";
import { Classroom } from "./Classroom";
import { canListen, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { startNoiseWatch, stopNoiseWatch } from "@/lib/noise";
import { remember } from "@/lib/memory";
import { think } from "@/lib/tutor";
import { emptyProfile, saveProfile, type Profile } from "@/lib/store";

type Step = "name" | "city" | "phone" | "gender" | "done";

const WELCOME =
  "Bonjour. Je suis Inocent KOFFI, ton enseignant virtuel. Je vais t'accompagner pour apprendre à lire, à écrire et à compter, gratuitement, étape par étape. Tu n'as pas besoin de savoir lire pour commencer. Tu n'as rien à préparer. Écoute simplement ma voix et fais ce que je te demande. On va apprendre ensemble, tranquillement. Comment tu t'appelles ?";

function cleanName(said: string) {
  return said
    .replace(/^(je m'appelle|je mappelle|moi c'est|c'est|mon nom est|je suis)\s*/i, "")
    .replace(/\.$/, "")
    .trim();
}

function questionFor(step: Exclude<Step, "done">, name: string) {
  if (step === "name") return WELCOME;
  if (step === "city") return `D'accord ${name}. Dis-moi, dans quelle ville tu habites ?`;
  if (step === "phone") return "Très bien. Dis-moi maintenant ton numéro de téléphone, doucement.";
  return `Dis-moi ${name}, est-ce que tu es un garçon, ou une fille ?`;
}

export function Onboarding({ onReady }: { onReady: (p: Profile) => void }) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Profile>(() => emptyProfile());
  const [line, setLine] = useState("Bonjour. Je suis Inocent KOFFI, ton ami et ton enseignant.");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");
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
    await say(`Merci ${profile.name}. À partir de maintenant, regarde et écoute seulement. Je vais te guider pas à pas, et on avance à ton rythme.`);
    if (alive.current) onReady(profile);
  }, [onReady, say]);

  const runConversation = useCallback(async (first: Step, initial: Profile) => {
    let current = first;
    let profile = initial;
    startNoiseWatch();
    while (alive.current && current !== "done") {
      await say(questionFor(current, profile.name));
      if (!alive.current) return;
      setListening(true);
      const result = canListen() ? await listenOnce(11000) : null;
      const heard = result?.text ?? "";
      setListening(false);
      if (!heard.trim()) {
        setNeedsUnlock(true);
        await say("Ce n'est pas grave. Appuie sur le grand bouton, puis parle doucement.");
        continue;
      }

      // L'enseignant comprend d'abord l'intention : « répète », « on reprend »,
      // une émotion, une question… avant de traiter la réponse.
      if (result) {
        const reply = await think({
          heard: result,
          situation: `Inscription de l'apprenant, étape : ${current}`,
          ...(profile.name ? { learner: profile.name } : {}),
        });
        if (!alive.current) return;
        if (reply && reply.intent !== "reponse") {
          await say(reply.reply);
          if (reply.next === "revenir_debut") current = "name";
          if (reply.next === "arreter") {
            saveProfile(profile);
            return;
          }
          continue;
        }
      }

      if (current === "name") {
        const name = cleanName(heard);
        if (!name) continue;
        profile = { ...profile, name, pendingSync: true };
        remember("note", `Se présente comme « ${name} ».`);
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
      saveProfile({ ...profile, onboardingComplete: current === "done" });
    }
    if (current === "done") await finish({ ...profile, onboardingComplete: true });
  }, [finish, say]);

  const submitManual = useCallback(async () => {
    const value = manualValue.trim();
    if (!value) return;
    let profile = draft;
    if (step === "name") {
      const name = cleanName(value);
      if (!name) return;
      profile = { ...profile, name, pendingSync: true };
      remember("note", `Se présente comme « ${name} ».`);
    } else if (step === "city") {
      profile = { ...profile, city: value, pendingSync: true };
    } else if (step === "phone") {
      profile = { ...profile, phone: value, pendingSync: true };
    } else if (step === "gender") {
      const normalized = value.toLowerCase();
      if (!["garçon", "garcon", "fille", "homme", "femme"].some((v) => normalized.includes(v))) return;
      profile = {
        ...profile,
        gender: normalized.includes("fille") || normalized.includes("femme") ? "fille" : "garcon",
        pendingSync: true,
      };
    } else return;

    const nextStep: Step =
      step === "name" ? "city" : step === "city" ? "phone" : step === "phone" ? "gender" : "done";
    setDraft(profile);
    setStep(nextStep);
    setManualValue("");
    saveProfile({ ...profile, onboardingComplete: nextStep === "done" });
    if (nextStep === "done") {
      await finish({ ...profile, onboardingComplete: true });
    } else {
      await say(questionFor(nextStep, profile.name));
    }
  }, [draft, finish, manualValue, say, step]);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setNeedsUnlock(false);
    void runConversation("name", draft);
  }, [draft, runConversation]);

  useEffect(() => {
    alive.current = true;
    if (!canListen()) {
      setManualMode(true);
      void say(WELCOME);
      return () => {
        alive.current = false;
        stopNoiseWatch();
        stopSpeaking();
      };
    }
    // On essaie immédiatement. Si le téléphone bloque la voix avant un geste,
    // toute la scène devient l'unique grande zone de démarrage.
    const timer = setTimeout(() => start(), 200);
    return () => {
      alive.current = false;
      stopNoiseWatch();
      stopSpeaking();
    };
  }, []); // démarrage unique

  return (
    <div className="mx-auto block min-h-[calc(100vh-4rem)] w-full max-w-xl space-y-5 bg-background px-4 py-6 text-left">
      <Classroom line={line} pose={listening ? "listen" : speaking ? "point" : "happy"} speaking={speaking} showTranscript={false}>
        <div className="flex min-h-[190px] items-center justify-center">
          <span className={`text-7xl ${listening ? "animate-pulse-soft" : ""}`} aria-hidden="true">
            {needsUnlock ? "👆" : listening ? "🎙️" : speaking ? "🗣️" : "🙂"}
          </span>
        </div>
      </Classroom>
      {needsUnlock ? (
        <button type="button" onClick={() => { started.current = false; start(); }} className="w-full rounded-3xl bg-primary px-5 py-5 text-xl font-bold text-primary-foreground">
          👆 Toucher pour démarrer la voix
        </button>
      ) : null}
      <div className="flex justify-center gap-3 text-3xl" aria-hidden="true">
        <span className={speaking ? "animate-pulse-soft" : "opacity-30"}>👨🏾‍🏫</span>
        <span>➡️</span>
        <span className={listening ? "animate-pulse-soft" : "opacity-30"}>🎙️</span>
      </div>
    </div>
  );
}
