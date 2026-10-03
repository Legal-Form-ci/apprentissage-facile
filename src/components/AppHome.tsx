import { useState, type ReactNode } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  Gauge,
  Headphones,
  Home,
  Mic,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { ClarityButton } from "@/components/ClarityButton";
import { VoiceCheck } from "@/components/VoiceCheck";
import { downloadCertificate } from "@/lib/certificate";
import { askPermission, loadReminder, saveReminder } from "@/lib/reminders";
import { fromRecoveryCode, importProfileFile, toRecoveryCode, exportProfile } from "@/lib/backup";
import { hasCertificate, masteredCount, progressPercent, type Profile } from "@/lib/store";
import { speak } from "@/lib/speech";

type Tab = "home" | "progress" | "profile";

export function AppHome({
  profile,
  online,
  onStart,
  onRestore,
}: {
  profile: Profile;
  online: boolean;
  onStart: () => void;
  onRestore: (profile: Profile) => void;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [showVoiceCheck, setShowVoiceCheck] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const percent = progressPercent(profile);
  const level = Math.min(5, Math.max(1, Math.ceil(Math.max(1, profile.day - 1) / 30)));

  if (showVoiceCheck) {
    return (
      <div className="app-screen">
        <AppTopBar title="Mon micro" onBack={() => setShowVoiceCheck(false)} />
        <div className="app-content">
          <VoiceCheck onDone={() => setShowVoiceCheck(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <AppTopBar
        title="N'nvlé Déclic"
        online={online}
        action={
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="icon-button"
            aria-label="Plus d'options"
          >
            <MoreHorizontal size={22} />
          </button>
        }
      />

      <main className="app-content app-content-bottom-nav">
        {tab === "home" ? (
          <HomeTab
            profile={profile}
            percent={percent}
            level={level}
            onStart={onStart}
            onVoiceCheck={() => setShowVoiceCheck(true)}
          />
        ) : null}
        {tab === "progress" ? <ProgressTab profile={profile} percent={percent} level={level} /> : null}
        {tab === "profile" ? (
          <ProfileTab profile={profile} level={level} onRestore={onRestore} />
        ) : null}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
      {showMore ? (
        <MoreSheet onClose={() => setShowMore(false)} profile={profile} level={level} />
      ) : null}
    </div>
  );
}

function HomeTab({
  profile,
  percent,
  level,
  onStart,
  onVoiceCheck,
}: {
  profile: Profile;
  percent: number;
  level: number;
  onStart: () => void;
  onVoiceCheck: () => void;
}) {
  const firstName = profile.name?.trim().split(/\s+/)[0] || "ami";
  const sessionCount = profile.sessions.length;

  return (
    <div className="space-y-5">
      <section className="welcome-card">
        <div>
          <p className="eyebrow">BONJOUR</p>
          <h1>Bonjour {firstName} 👋</h1>
          <p>On continue doucement, une petite étape à la fois.</p>
        </div>
        <div className="welcome-avatar" aria-hidden="true">
          {profile.gender === "fille" ? "👩🏾" : "👨🏾"}
        </div>
      </section>

      <section className="lesson-card">
        <div className="lesson-card-top">
          <div>
            <span className="lesson-badge"><Sparkles size={14} /> À faire aujourd'hui</span>
            <h2>Mon apprentissage</h2>
            <p>Une courte séance adaptée à ton parcours.</p>
          </div>
          <div className="day-orb" aria-label={`Jour ${profile.day}`}>
            <strong>{profile.day}</strong>
            <span>jour</span>
          </div>
        </div>
        <button type="button" className="primary-action" onClick={onStart}>
          Commencer
          <ChevronRight size={22} />
        </button>
        <div className="lesson-meta">
          <span><Clock3 size={16} /> Environ 15 min</span>
          <span><Flame size={16} /> {profile.stars} étoiles</span>
        </div>
      </section>

      <section className="progress-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MON PARCOURS</p>
            <h2>Niveau {level}</h2>
          </div>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-track" aria-label={`Progression ${percent}%`}>
          <div style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-footer">
          <span>{masteredCount(profile)} compétences maîtrisées</span>
          <span>{sessionCount} séance{sessionCount > 1 ? "s" : ""}</span>
        </div>
      </section>

      <section className="quick-grid">
        <QuickAction icon={<Mic />} title="Tester le micro" text="Vérifier la voix" onClick={onVoiceCheck} />
        <QuickAction icon={<Volume2 />} title="Écouter" text="Réécouter l'accueil" onClick={() => void speak(`Bonjour ${profile.name}. On continue ensemble.`)} />
      </section>

      <div className="offline-note">
        {typeof navigator !== "undefined" && navigator.onLine ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>Ton parcours est enregistré sur ce téléphone.</span>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" className="quick-card" onClick={onClick}>
      <span className="quick-icon">{icon}</span>
      <span><strong>{title}</strong><small>{text}</small></span>
    </button>
  );
}

function ProgressTab({ profile, percent, level }: { profile: Profile; percent: number; level: number }) {
  const mastered = masteredCount(profile);
  return (
    <div className="space-y-5">
      <section className="page-heading">
        <p className="eyebrow">MON PARCOURS</p>
        <h1>Mes progrès</h1>
        <p>Voici ce que tu as déjà appris.</p>
      </section>
      <section className="stats-grid">
        <Stat icon={<Gauge />} value={`${percent}%`} label="Progression" />
        <Stat icon={<Award />} value={String(mastered)} label="Maîtrisées" />
        <Stat icon={<BookOpen />} value={String(profile.sessions.length)} label="Séances" />
        <Stat icon={<Flame />} value={String(profile.stars)} label="Étoiles" />
      </section>
      <section className="progress-card">
        <div className="section-heading">
          <div><p className="eyebrow">NIVEAU ACTUEL</p><h2>Niveau {level}</h2></div>
          <span className="level-pill">En cours</span>
        </div>
        <div className="progress-track"><div style={{ width: `${percent}%` }} /></div>
        <p className="helper-text">Les compétences sont revues plusieurs fois avant d'être considérées comme maîtrisées.</p>
      </section>
      <section className="history-card">
        <div className="section-heading"><h2>Dernières séances</h2></div>
        {profile.sessions.length === 0 ? (
          <p className="empty-state">Tes séances apparaîtront ici après ton premier apprentissage.</p>
        ) : (
          [...profile.sessions].reverse().slice(0, 5).map((session) => (
            <div className="history-row" key={`${session.date}-${session.day}`}>
              <span className="history-day">J{session.day}</span>
              <span><strong>{session.activities} activités</strong><small>{new Date(session.date).toLocaleDateString("fr-FR")}</small></span>
              <ChevronRight size={18} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return <div className="stat-card"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>;
}

function ProfileTab({
  profile,
  level,
  onRestore,
}: {
  profile: Profile;
  level: number;
  onRestore: (profile: Profile) => void;
}) {
  const [reminder, setReminder] = useState(() => loadReminder());
  const certificate = hasCertificate(profile, level);
  return (
    <div className="space-y-5">
      <section className="page-heading">
        <p className="eyebrow">MON ESPACE</p>
        <h1>Mon profil</h1>
        <p>Ton parcours et tes réglages.</p>
      </section>

      <section className="profile-card">
        <div className="profile-avatar">{profile.gender === "fille" ? "👩🏾" : "👨🏾"}</div>
        <div><h2>{profile.name || "Mon profil"}</h2><p>{profile.city || "Côte d'Ivoire"}</p></div>
      </section>

      <section className="settings-card">
        <SettingRow icon={<Headphones />} title="Clarté de la voix" text="Adapter la vitesse de l'enseignant" trailing={<ClarityButton />} />
        <SettingRow icon={<Clock3 />} title="Rappel quotidien" text="15 minutes par jour" trailing={
          <button className={`toggle-pill ${reminder.enabled ? "active" : ""}`} onClick={async () => {
            const enabled = !reminder.enabled;
            if (enabled) await askPermission();
            const next = { ...reminder, enabled };
            setReminder(next); saveReminder(next);
          }}>{reminder.enabled ? "Activé" : "Activer"}</button>
        } />
        {certificate ? (
          <SettingRow icon={<Award />} title="Certificat" text={`Niveau ${level} validé`} trailing={
            <button className="small-action" onClick={() => downloadCertificate(profile, level)}><Download size={17} /></button>
          } />
        ) : null}
      </section>

      <section className="settings-card">
        <div className="settings-title"><ShieldCheck size={19} /><span>Mes données</span></div>
        <button className="list-action" onClick={() => exportProfile(profile)}><Download size={18} /><span><strong>Enregistrer mon parcours</strong><small>Faire une sauvegarde sur le téléphone</small></span><ChevronRight size={18} /></button>
        <button className="list-action" onClick={() => {
          const code = toRecoveryCode(profile);
          navigator.clipboard?.writeText(code);
          window.alert("Code de récupération copié.");
        }}><RotateCcw size={18} /><span><strong>Code de récupération</strong><small>Retrouver le parcours sur un autre téléphone</small></span><ChevronRight size={18} /></button>
        <label className="list-action">
          <Download size={18} />
          <span><strong>Importer une sauvegarde</strong><small>Restaurer un fichier de parcours</small></span>
          <ChevronRight size={18} />
          <input type="file" accept="application/json" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const restored = await importProfileFile(file);
            if (restored) onRestore(restored);
          }} />
        </label>
        <RecoveryCodeRestore onRestore={onRestore} />
      </section>

      <p className="legal-note">N'nvlé Déclic respecte ton rythme. Tes données de progression restent sur ton appareil tant qu'aucun service de synchronisation n'est configuré.</p>
    </div>
  );
}

function RecoveryCodeRestore({ onRestore }: { onRestore: (profile: Profile) => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="recovery-inline">
      <div className="settings-title"><RotateCcw size={18} /><span>Restaurer avec un code</span></div>
      <div className="recovery-inline-row">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Colle ton code ici" />
        <button onClick={() => {
          const restored = fromRecoveryCode(code);
          if (restored) onRestore(restored);
        }}>Restaurer</button>
      </div>
    </div>
  );
}

function SettingRow({ icon, title, text, trailing }: { icon: ReactNode; title: string; text: string; trailing: ReactNode }) {
  return <div className="setting-row"><span className="setting-icon">{icon}</span><span className="setting-copy"><strong>{title}</strong><small>{text}</small></span>{trailing}</div>;
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      <NavItem active={tab === "home"} icon={<Home />} label="Accueil" onClick={() => setTab("home")} />
      <NavItem active={tab === "progress"} icon={<BarChart3 />} label="Progrès" onClick={() => setTab("progress")} />
      <NavItem active={tab === "profile"} icon={<UserRound />} label="Profil" onClick={() => setTab("profile")} />
    </nav>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function AppTopBar({ title, online, onBack, action }: { title: string; online?: boolean; onBack?: () => void; action?: ReactNode }) {
  return (
    <header className="app-topbar">
      {onBack ? <button className="icon-button" onClick={onBack} aria-label="Retour"><ChevronRight className="rotate-180" /></button> : <div className="brand-mark"><img src="/logo.png" alt="" /><span>{title}</span></div>}
      {onBack ? <h1 className="topbar-title">{title}</h1> : null}
      <div className="topbar-actions">
        {online !== undefined ? <span className={`status-dot ${online ? "online" : "offline"}`} title={online ? "En ligne" : "Hors connexion"} /> : null}
        {action}
      </div>
    </header>
  );
}

function MoreSheet({ onClose, profile, level }: { onClose: () => void; profile: Profile; level: number }) {
  const [code, setCode] = useState("");
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="more-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title"><h2>Plus</h2><button className="icon-button" onClick={onClose}><X /></button></div>
        <div className="sheet-grid">
          <button onClick={() => exportProfile(profile)}><Download /><span>Sauvegarder</span></button>
          <button onClick={() => { setCode(toRecoveryCode(profile)); }}><RotateCcw /><span>Code de récupération</span></button>
          {hasCertificate(profile, level) ? <button onClick={() => downloadCertificate(profile, level)}><Award /><span>Certificat</span></button> : null}
        </div>
        {code ? <textarea value={code} readOnly className="recovery-code" onClick={(e) => e.currentTarget.select()} /> : null}
        <p className="sheet-footnote">Tu peux retrouver ton parcours même sans connexion.</p>
      </section>
    </div>
  );
}
