import { useCallback, useEffect, useRef, useState } from "react";

import { Classroom } from "./Classroom";
import { canListen, listenOnce, matchScore, speak, stopSpeaking } from "@/lib/speech";
import { getNoiseMode, measureAmbient, runMicTest, setNoiseMode, startNoiseWatch, type MicTest, type NoiseMode } from "@/lib/noise";

const PHRASE = "Je veux apprendre à lire et à écrire";

type Phase = "intro" | "silence" | "test" | "lecture" | "resultat";

/**
 * Assistant de calibration guidée : test de micro et de latence, mesure du
 * bruit, lecture d'un court texte, puis verdict sur la fiabilité de la
 * détection. Tout est vocal, l'apprenant n'a rien à lire pour avancer.
 */
export function VoiceCheck({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [line, setLine] = useState("On va vérifier que je t'entends bien.");
  const [speaking, setSpeaking] = useState(false);
  const [test, setTest] = useState<MicTest | null>(null);
  const [heardText, setHeardText] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [mode, setMode] = useState<NoiseMode>("auto");
  const alive = useRef(true);
  const started = useRef(false);

  const say = useCallback(async (text: string) => {
    setLine(text);
    setSpeaking(true);
    await speak(text);
    if (alive.current) setSpeaking(false);
  }, []);

  const run = useCallback(async () => {
    startNoiseWatch();
    await say("Bonjour. On va d'abord vérifier que je t'entends bien. Reste silencieux un petit moment.");
    if (!alive.current) return;
    setPhase("silence");
    await measureAmbient(1400);
    if (!alive.current) return;
    await say("Merci. Maintenant, parle-moi. Dis n'importe quoi, par exemple : bonjour maître.");
    if (!alive.current) return;
    setPhase("test");
    const result = await runMicTest(3200);
    if (!alive.current) return;
    setTest(result);
    if (result.verdict === "muet") {
      await say("Je ne t'entends pas encore. Approche le téléphone de ta bouche, et on essaie encore.");
      if (alive.current) setPhase("resultat");
      return;
    }
    await say(`Je t'entends. Maintenant, répète après moi : ${PHRASE}.`);
    if (!alive.current) return;
    setPhase("lecture");
    if (canListen()) {
      const heard = await listenOnce(11000);
      if (!alive.current) return;
      const text = [heard.text, ...heard.alternatives].filter(Boolean).join(" · ");
      setHeardText(text);
      const s = matchScore(PHRASE, heard.text || heard.alternatives[0] || "");
      setScore(s);
      if (s >= 0.5) {
        await say("Parfait, c'est bien ta voix et je te comprends très bien. On peut commencer.");
      } else if (heard.voiced) {
        await say("Je t'entends parler, mais pas assez clairement. Je vais renforcer le filtre du bruit.");
        setNoiseMode("fort");
        setMode("fort");
      } else {
        await say("Je n'ai pas bien capté. On peut recommencer la vérification quand tu veux.");
      }
    }
    if (alive.current) setPhase("resultat");
  }, [say]);

  useEffect(() => {
    alive.current = true;
    setMode(getNoiseMode());
    if (!started.current) {
      started.current = true;
      const t = setTimeout(() => void run(), 300);
      return () => {
        clearTimeout(t);
        alive.current = false;
        stopSpeaking();
      };
    }
    return () => {
      alive.current = false;
      stopSpeaking();
    };
  }, [run]);

  const verdictText =
    test?.verdict === "excellent"
      ? "🎉 Micro excellent"
      : test?.verdict === "bon"
        ? "🙂 Micro correct"
        : test?.verdict === "bruyant"
          ? "🔊 Beaucoup de bruit autour de toi"
          : test
            ? "🤫 Je ne t'entends pas"
            : "…";

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-5">
      <Classroom line={line} pose={phase === "test" || phase === "lecture" ? "listen" : "point"} speaking={speaking}>
        <div className="flex min-h-[190px] flex-col items-center justify-center gap-3">
          <span className="text-6xl" aria-hidden="true">
            {phase === "silence" ? "🤫" : phase === "test" || phase === "lecture" ? "🎙️" : "✅"}
          </span>
          {phase === "lecture" ? <p className="font-display text-3xl">{PHRASE}</p> : null}
        </div>
      </Classroom>

      <div className="rounded-2xl bg-card p-4 shadow-warm" aria-live="polite">
        <p className="text-xs font-bold tracking-widest text-muted-foreground">SOUS-TITRES</p>
        <p className="mt-1 text-xl leading-snug font-semibold text-card-foreground">{line}</p>
      </div>

      {/* Sous-titres de ce que l'application a détecté : « est-ce bien ma voix ? » */}
      <div className="rounded-2xl bg-secondary p-4">
        <p className="text-xs font-bold tracking-widest text-secondary-foreground/70">CE QUE J'AI ENTENDU</p>
        <p className="mt-1 text-lg font-semibold text-secondary-foreground">{heardText || "…"}</p>
        {score !== null ? (
          <p className="mt-2 text-base text-secondary-foreground">
            {score >= 0.5 ? "✅ C'est bien ta voix, je te comprends" : "⚠️ Détection faible — refaisons la calibration"}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-card p-4 text-center shadow-warm">
        <div>
          <p className="text-xs font-bold tracking-widest text-muted-foreground">MICRO</p>
          <p className="text-lg font-semibold text-card-foreground">{verdictText}</p>
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-muted-foreground">LATENCE</p>
          <p className="text-lg font-semibold text-card-foreground">
            {test ? `${test.latencyMs} ms` : "…"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-warm">
        <p className="text-xs font-bold tracking-widest text-muted-foreground">RÉDUCTION DU BRUIT</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {(["auto", "fort", "leger", "off"] as NoiseMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setNoiseMode(m);
                setMode(m);
              }}
              className={`rounded-2xl px-2 py-3 text-sm font-bold ${
                mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {m === "auto" ? "🤖 Auto" : m === "fort" ? "🔇 Fort" : m === "leger" ? "🔉 Léger" : "🚫 Off"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <button
          onClick={() => {
            started.current = true;
            setHeardText("");
            setScore(null);
            setTest(null);
            void run();
          }}
          className="w-full rounded-3xl bg-accent px-6 py-6 text-xl font-bold text-accent-foreground shadow-warm"
        >
          🔁 Refaire le test
        </button>
        <button
          onClick={() => {
            stopSpeaking();
            onDone();
          }}
          className="w-full rounded-3xl bg-primary px-6 py-6 text-2xl font-bold text-primary-foreground shadow-warm"
        >
          ✅ Je peux commencer
        </button>
      </div>
    </div>
  );
}
