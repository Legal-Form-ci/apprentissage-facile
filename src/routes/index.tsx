import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Onboarding } from "@/components/Onboarding";
import { DailySession } from "@/components/DailySession";
import { speak } from "@/lib/speech";
import { exportProfile, fromRecoveryCode, importProfileFile, toRecoveryCode } from "@/lib/backup";
import { downloadCertificate } from "@/lib/certificate";
import { askPermission, checkReminder, loadReminder, saveReminder } from "@/lib/reminders";
import {
  loadProfile,
  masteredCount,
  progressPercent,
  resetProfile,
  saveProfile,
  type Profile,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "N'nvlé Déclic — Apprendre à lire, écrire et compter" },
      {
        name: "description",
        content:
          "N'nvlé Déclic accompagne les adultes pas à pas : un enseignant qui parle, des exercices vocaux, l'écriture au doigt et le calcul du quotidien, 15 minutes par jour.",
      },
      { property: "og:title", content: "N'nvlé Déclic — Le plaisir d'apprendre, pas à pas" },
      {
        property: "og:description",
        content:
          "Alphabétisation vocale et visuelle pour adultes : lettres, syllabes, mots, écriture et calcul, avec un enseignant numérique chaleureux.",
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
    if (p && p.onboardingComplete) {
      setProfile(p);
      // Reprise exacte : si une séance était commencée, on repart au même exercice
      setView(p.activityIndex > 0 ? "session" : "home");
    } else {
      setView("onboarding");
    }
    checkReminder();
    const rem = setInterval(checkReminder, 60000);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearInterval(rem);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Synchronisation invisible dès que la connexion revient
  useEffect(() => {
    if (!profile?.pendingSync || !online) return;
    const t = setTimeout(() => {
      const synced = { ...profile, pendingSync: false };
      saveProfile(synced);
      setProfile(synced);
    }, 1500);
    return () => clearTimeout(t);
  }, [profile, online]);

  if (view === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <img src={"/logo.png"} alt="N'nvlé Déclic" className="w-64" />
      </main>
    );
  }

  if (view === "onboarding" || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <Header online={online} />
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
      <main className="min-h-screen bg-background">
        <Header online={online} />
        <DailySession
          profile={profile}
          setProfile={setProfile}
          onFinish={() => setView("celebrate")}
        />
      </main>
    );
  }

  if (view === "celebrate") {
    const level = Math.min(6, Math.max(1, Math.ceil(profile.day / 30)));
    return (
      <main className="min-h-screen bg-background">
        <Header online={online} />
        <section className="mx-auto max-w-xl px-4 py-10 text-center">
          <p className="text-6xl">🎉</p>
          <h1 className="font-display mt-4 text-4xl text-foreground">
            Bravo {profile.name || "à toi"} !
          </h1>
          <p className="mt-3 text-xl text-muted-foreground">
            Défi terminé. Tu as gagné {profile.stars} étoiles. Reviens demain, on continue.
          </p>
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-warm">
            <p className="text-sm font-semibold tracking-widest text-muted-foreground">
              CERTIFICAT — NIVEAU {level}
            </p>
            <p className="mt-2 text-lg text-card-foreground">
              {masteredCount(profile)} compétences maîtrisées
            </p>
          </div>
          <button
            onClick={() => {
              speak(`Bravo ${profile.name}. À demain !`);
              setView("home");
            }}
            className="mt-8 w-full rounded-3xl bg-primary px-6 py-6 text-2xl font-bold text-primary-foreground shadow-warm"
          >
            👍 Merci
          </button>
        </section>
      </main>
    );
  }

  const percent = progressPercent(profile);
  const greeting = `Bonjour ${profile.name} ! Tu es revenu. On continue ?`;

  return (
    <main className="min-h-screen bg-background">
      <Header online={online} />
      <section className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <div className="rounded-3xl bg-card p-5 shadow-warm">
          <div className="flex items-center gap-4">
            <img src={"/logo.png"} alt="" className="h-20 w-20 rounded-full object-cover object-top" />
            <div>
              <h1 className="font-display text-2xl text-card-foreground">
                Bonjour {profile.name} !
              </h1>
              <p className="text-lg text-muted-foreground">
                Jour {profile.day} · ⭐ {profile.stars}
              </p>
            </div>
          </div>
          <button
            onClick={() => speak(greeting)}
            className="mt-4 rounded-full bg-secondary px-4 py-2 font-semibold text-secondary-foreground"
          >
            🔊 Écouter
          </button>
        </div>

        <button
          onClick={() => setView("session")}
          className="w-full rounded-3xl bg-primary px-6 py-10 text-3xl font-bold text-primary-foreground shadow-warm"
        >
          🎯 Mon défi du jour
        </button>

        <div className="grid grid-cols-2 gap-3 text-center">
          {[
            { icon: "🎙️", label: "Écouter" },
            { icon: "👄", label: "Parler" },
            { icon: "👁️", label: "Lire" },
            { icon: "✍️", label: "Écrire" },
            { icon: "🧮", label: "Compter" },
            { icon: "🛒", label: "Vie quotidienne" },
          ].map((c) => (
            <button
              key={c.label}
              onClick={() => setView("session")}
              className="rounded-3xl bg-card p-5 text-xl font-semibold text-card-foreground shadow-warm"
            >
              <span className="block text-3xl">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-warm">
          <p className="text-lg font-semibold text-card-foreground">Tu progresses bien 💪</p>
          <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-muted-foreground">
            {masteredCount(profile)} choses bien maîtrisées · {profile.sessions.length} séances
          </p>
          {profile.certificates.length > 0 ? (
            <p className="mt-2 text-muted-foreground">
              🏅 {profile.certificates.length} certificat(s)
            </p>
          ) : null}
        </div>

        <Tools profile={profile} onRestore={(p) => { setProfile(p); setView("home"); }} />

        <button
          onClick={() => {
            resetProfile();
            setProfile(null);
            setView("onboarding");
          }}
          className="w-full rounded-2xl border-2 border-border px-4 py-3 text-sm font-semibold text-muted-foreground"
        >
          Nouvelle personne
        </button>
        <Footer />
      </section>
    </main>
  );
}

function Footer() {
  return (
    <p className="pt-2 pb-6 text-center text-sm font-semibold text-muted-foreground">
      N'nvlé Déclic - par Inocent KOFFI
    </p>
  );
}

function Tools({
  profile,
  onRestore,
}: {
  profile: Profile;
  onRestore: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [reminder, setReminder] = useState(() => loadReminder());
  const level = Math.min(6, Math.max(1, Math.ceil(profile.day / 30)));

  function updateReminder(next: typeof reminder) {
    setReminder(next);
    saveReminder(next);
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-warm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left text-lg font-bold text-card-foreground"
      >
        {open ? "▾" : "▸"} Mon parcours, mes certificats et mes rappels
      </button>

      {open ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="font-semibold text-card-foreground">📥 Garder mon parcours</p>
            <button
              onClick={() => exportProfile(profile)}
              className="w-full rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground"
            >
              Enregistrer sur mon téléphone
            </button>
            <button
              onClick={() => {
                setCode(toRecoveryCode(profile));
                setMsg("Recopie ce code pour retrouver ton parcours sur un autre téléphone.");
              }}
              className="w-full rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground"
            >
              Voir mon code de récupération
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-card-foreground">📤 Retrouver mon parcours</p>
            <input
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const restored = await importProfileFile(file);
                if (restored) {
                  onRestore(restored);
                  setMsg("Parcours retrouvé. On continue !");
                } else setMsg("Ce fichier n'est pas le bon.");
              }}
              className="w-full rounded-2xl border-2 border-border px-3 py-2 text-sm"
            />
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="… ou colle ici ton code de récupération"
              className="h-24 w-full rounded-2xl border-2 border-border bg-background p-3 text-xs"
            />
            <button
              onClick={() => {
                const restored = fromRecoveryCode(code);
                if (restored) {
                  saveProfile(restored);
                  onRestore(restored);
                  setMsg("Parcours retrouvé. On continue !");
                } else setMsg("Ce code n'est pas valable.");
              }}
              className="w-full rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground"
            >
              Récupérer avec le code
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-card-foreground">🏅 Mon certificat</p>
            <button
              onClick={() => downloadCertificate(profile, level)}
              className="w-full rounded-2xl bg-accent px-4 py-3 font-bold text-accent-foreground"
            >
              Télécharger mon certificat (PDF)
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-card-foreground">⏰ Mon rappel de 15 minutes</p>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  const next = { ...reminder, enabled: !reminder.enabled };
                  if (next.enabled) await askPermission();
                  updateReminder(next);
                }}
                className="rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground"
              >
                {reminder.enabled ? "Rappel activé ✅" : "Activer le rappel"}
              </button>
              <input
                type="time"
                value={`${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":");
                  updateReminder({ ...reminder, hour: Number(h ?? 18), minute: Number(m ?? 0) });
                }}
                className="rounded-2xl border-2 border-border bg-background px-3 py-3"
              />
            </div>
          </div>

          {msg ? <p className="text-sm font-semibold text-primary">{msg}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function Header({ online }: { online: boolean }) {
  return (
    <header className="flex items-center justify-between px-4 pt-4">
      <p className="font-display text-lg text-foreground">N'nvlé Déclic</p>
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
        {online ? "☁️ Synchronisé" : "📴 Hors connexion — ça marche quand même"}
      </span>
    </header>
  );
}
