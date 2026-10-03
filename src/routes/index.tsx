import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppHome } from "@/components/AppHome";
import { DailySession } from "@/components/DailySession";
import { Onboarding } from "@/components/Onboarding";
import { speak } from "@/lib/speech";
import {
  loadProfile,
  resetProfile,
  type Profile,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "N'nvlé Déclic — Apprendre à lire, écrire et compter" },
      {
        name: "description",
        content:
          "N'nvlé Déclic accompagne les adultes pas à pas : un enseignant qui parle, des exercices vocaux, l'écriture et le calcul du quotidien.",
      },
      { property: "og:title", content: "N'nvlé Déclic" },
      {
        property: "og:description",
        content: "Apprendre à lire, écrire et compter, pas à pas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type View = "loading" | "onboarding" | "home" | "session" | "celebrate";

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>("loading");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const p = loadProfile();
    if (p?.onboardingComplete) {
      setProfile(p);
      setView(p.activityIndex > 0 ? "session" : "home");
    } else {
      setView("onboarding");
    }

    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (view === "loading") {
    return (
      <main className="splash-screen">
        <img src="/logo.png" alt="N'nvlé Déclic" />
        <span>Un pas après l'autre.</span>
      </main>
    );
  }

  if (view === "onboarding" || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <Onboarding
          onReady={(p) => {
            setProfile(p);
            setView("session");
          }}
        />
      </main>
    );
  }

  if (view === "session") {
    return (
      <main className="session-screen">
        <DailySession
          profile={profile}
          setProfile={setProfile}
          onFinish={() => setView("celebrate")}
        />
      </main>
    );
  }

  if (view === "celebrate") {
    return <Celebration profile={profile} onContinue={() => setView("home")} />;
  }

  return (
    <AppHome
      profile={profile}
      online={online}
      onStart={() => setView("session")}
      onRestore={(next) => {
        if (!next.id) {
          resetProfile();
          setProfile(null);
          setView("onboarding");
          return;
        }
        setProfile(next);
        setView("home");
      }}
    />
  );
}

function Celebration({ profile, onContinue }: { profile: Profile; onContinue: () => void }) {
  return (
    <main className="celebration-screen">
      <div className="celebration-glow" aria-hidden="true" />
      <div className="celebration-content">
        <div className="celebration-icon">✓</div>
        <p className="eyebrow">SÉANCE TERMINÉE</p>
        <h1>Bravo {profile.name?.split(/\s+/)[0] || "à toi"} !</h1>
        <p>Tu as fait ton travail aujourd'hui. Chaque petite étape compte.</p>
        <div className="celebration-stats">
          <div><strong>+1</strong><span>séance</span></div>
          <div><strong>{profile.stars}</strong><span>étoiles</span></div>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            void speak(`Bravo ${profile.name || ""}. À demain !`);
            onContinue();
          }}
        >
          Continuer
          <span>→</span>
        </button>
      </div>
    </main>
  );
}
