// Moteur local : profil, progression et maîtrise.
// Le produit est local-first : aucune perte de progression lorsque la connexion disparaît.
// pendingSync reste vrai tant qu'aucun serveur de synchronisation réel n'est configuré.

import type { SkillState } from "./curriculum";
import { DAYS_PER_LEVEL, MAX_LEVEL } from "./curriculum";

const KEY = "nnvle-declic-v2";
const LEGACY_KEY = "nnvle-declic-v1";

export type SkillRecord = {
  id: string;
  state: SkillState;
  success: number;
  fail: number;
  lastSeen: string;
  dueAt: string;
  streak: number;
};

export type SessionRecord = {
  date: string;
  day: number;
  activities: number;
  success: number;
};

export type Profile = {
  id: string;
  name: string;
  city: string;
  phone: string;
  gender: "garcon" | "fille" | "";
  level: number;
  onboardingComplete: boolean;
  startedAt: string;
  day: number;
  activityIndex: number;
  stars: number;
  skills: Record<string, SkillRecord>;
  sessions: SessionRecord[];
  certificates: Array<{ level: number; date: string }>;
  pendingSync: boolean;
  lastActivityId: string;
  bestScores: Record<string, number>;
};

const STATES: SkillState[] = [
  "non_apprise",
  "en_apprentissage",
  "presque",
  "maitrisee",
  "consolidee",
];

export function emptyProfile(): Profile {
  return {
    id: `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    name: "",
    city: "",
    phone: "",
    gender: "",
    startedAt: new Date().toISOString(),
    day: 1,
    activityIndex: 0,
    stars: 0,
    skills: {},
    sessions: [],
    certificates: [],
    pendingSync: false,
    level: 1,
    onboardingComplete: false,
    lastActivityId: "",
    bestScores: {},
  };
}

export function normalizeProfile(raw: Partial<Profile>): Profile {
  const base = emptyProfile();
  const skills = Object.fromEntries(
    Object.entries(raw.skills ?? {}).map(([id, skill]) => {
      const value = skill as Partial<SkillRecord>;
      return [
        id,
        {
          id,
          state: value.state ?? "non_apprise",
          success: value.success ?? 0,
          fail: value.fail ?? 0,
          lastSeen: value.lastSeen ?? "",
          dueAt: value.dueAt ?? value.lastSeen ?? "",
          streak: value.streak ?? 0,
        } satisfies SkillRecord,
      ];
    }),
  );

  return {
    ...base,
    ...raw,
    skills,
    bestScores: raw.bestScores ?? {},
    sessions: raw.sessions ?? [],
    certificates: raw.certificates ?? [],
    pendingSync: raw.pendingSync ?? false,
  };
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(KEY) ??
      window.localStorage.getItem(LEGACY_KEY) ??
      window.localStorage.getItem(`${LEGACY_KEY}-backup`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (!parsed?.id) return null;
    const profile = normalizeProfile(parsed);
    // Une migration réussie est persistée sous la nouvelle clé.
    window.localStorage.setItem(KEY, JSON.stringify(profile));
    return profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify(profile);
    window.localStorage.setItem(KEY, payload);
    window.localStorage.setItem(`${KEY}-backup`, payload);
  } catch {
    // Le parcours continue même si le stockage du navigateur est indisponible.
  }
}

export function resetProfile() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(`${KEY}-backup`);
    window.localStorage.removeItem(LEGACY_KEY);
    window.localStorage.removeItem(`${LEGACY_KEY}-backup`);
  }
}

export function learningLevel(day: number) {
  return Math.min(MAX_LEVEL, Math.max(1, Math.ceil(day / DAYS_PER_LEVEL)));
}

function nextReviewAt(streak: number, ok: boolean) {
  const days = ok
    ? [1, 2, 4, 7, 14, 30][Math.min(streak, 5)] ?? 30
    : 1;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Met à jour la maîtrise et planifie une révision espacée. */
export function recordAnswer(profile: Profile, skillId: string, ok: boolean, score = ok ? 1 : 0): Profile {
  const prev: SkillRecord =
    profile.skills[skillId] ??
    {
      id: skillId,
      state: "non_apprise",
      success: 0,
      fail: 0,
      lastSeen: "",
      dueAt: new Date().toISOString(),
      streak: 0,
    };

  const success = prev.success + (ok ? 1 : 0);
  const fail = prev.fail + (ok ? 0 : 1);
  const streak = ok ? (prev.streak ?? 0) + 1 : 0;

  // Une compétence n'est pas validée sur une seule réussite.
  // Il faut une progression répétée, puis des révisions espacées.
  let idx = STATES.indexOf(prev.state);
  if (ok) {
    idx = Math.min(STATES.length - 1, idx + 1);
  } else {
    idx = Math.max(0, idx - 1);
  }

  const lastSeen = new Date().toISOString();
  const next: SkillRecord = {
    ...prev,
    id: skillId,
    state: STATES[idx] ?? "non_apprise",
    success,
    fail,
    lastSeen,
    dueAt: nextReviewAt(streak, ok),
    streak,
  };

  return {
    ...profile,
    stars: profile.stars + (ok ? 1 : 0),
    skills: { ...profile.skills, [skillId]: next },
    bestScores: {
      ...profile.bestScores,
      [skillId]: Math.max(profile.bestScores?.[skillId] ?? 0, score),
    },
    lastActivityId: skillId,
    pendingSync: true,
  };
}

export function masteredCount(profile: Profile) {
  return Object.values(profile.skills).filter(
    (s) => s.state === "maitrisee" || s.state === "consolidee",
  ).length;
}

export function dueSkillIds(profile: Profile, limit = 3) {
  const now = Date.now();
  return Object.values(profile.skills)
    .filter((skill) => skill.dueAt && Date.parse(skill.dueAt) <= now)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, limit)
    .map((skill) => skill.id);
}

/**
 * Progression globale du parcours : 70 % du chemin pédagogique + 30 % de maîtrise.
 * Cela évite qu'une seule compétence maîtrisée affiche artificiellement 100 %.
 */
export function progressPercent(profile: Profile) {
  const totalDays = MAX_LEVEL * DAYS_PER_LEVEL;
  const course = Math.min(100, Math.max(0, ((profile.day - 1) / totalDays) * 100));
  const seen = Object.keys(profile.skills).length;
  const mastery = seen ? (masteredCount(profile) / seen) * 100 : 0;
  return Math.round(course * 0.7 + mastery * 0.3);
}

export function hasCertificate(profile: Profile, level: number) {
  return profile.certificates.some((certificate) => certificate.level === level);
}
