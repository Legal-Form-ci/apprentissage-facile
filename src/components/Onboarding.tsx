import { useCallback, useEffect, useRef, useState } from "react";
import { Classroom } from "./Classroom";
import { canListen, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { startNoiseWatch, stopNoiseWatch } from "@/lib/noise";
import { remember } from "@/lib/memory";
import { think } from "@/lib/tutor";
import { emptyProfile, saveProfile, type Profile } from "@/lib/store";

type Step = "name" | "city" | "phone" | "gender" | "done";

const WELCOME =
  "Bonjour. Je suis Inocent KOFFI. Je suis là pour t'apprendre à lire et à écrire, progressivement. Avant de commencer, il faut noter que je suis ton ami, et je vais m'adapter à ton niveau d'apprentissage. Maintenant, comment tu t'appelles ? Dis-moi ton nom et ton prénom.";

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
  const [heardText, setHeardText] = useState("");
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
      setHeardText(result ? [result.text, ...result.alternatives].filter(Boolean).join(" · ") : "");
      if (!heard.trim()) {
        await say("Ce n'est pas grave. Je remets mon oreille. Parle maintenant, doucement.");
        continue;
      }

      // L'enseignant comprend d'abord l'intention : « répète », « on reprend »,
      // une émotion, une question… avant de traiter la réponse.
      if (result) {
        const reply = await think({
          heard: result,
          situation: `Inscription de l'apprenant, étape : ${current}`,
          learner: profile.name || undefined,
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
      stopNoiseWatch();
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
      {/* Sous-titres de ce que l'application a détecté */}
      <div className="rounded-2xl bg-secondary p-3 text-center">
        <p className="text-xs font-bold tracking-widest text-secondary-foreground/70">CE QUE J'AI ENTENDU</p>
        <p className="text-lg font-semibold text-secondary-foreground">{heardText || "…"}</p>
      </div>
      <div className="flex justify-center gap-3 text-3xl" aria-hidden="true">
        <span className={speaking ? "animate-pulse-soft" : "opacity-30"}>👨🏾‍🏫</span>
        <span>➡️</span>
        <span className={listening ? "animate-pulse-soft" : "opacity-30"}>🎙️</span>
      </div>
      <p className="text-center text-xs text-muted-foreground">Étape {step === "name" ? 1 : step === "city" ? 2 : step === "phone" ? 3 : 4} sur 4 · {draft.name || "…"}</p>
    </button>
  );
}
