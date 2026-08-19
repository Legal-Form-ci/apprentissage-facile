// Moteur local : profil, progression, maîtrise. Tout est enregistré
// immédiatement sur le téléphone (local-first), puis synchronisable.

import type { SkillState } from "./curriculum";

const KEY = "nnvle-declic-v1";

export type SkillRecord = {
  id: string;
  state: SkillState;
  success: number;
  fail: number;
  lastSeen: string;
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
  startedAt: string;
  day: number;
  activityIndex: number;
  stars: number;
  skills: Record<string, SkillRecord>;
  sessions: SessionRecord[];
  certificates: Array<{ level: number; date: string }>;
  pendingSync: boolean;
  gender: "M" | "F" | "O" | null;
  level: number;
  onboardingComplete: boolean;
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
    gender: null,
    level: 1,
    onboardingComplete: false,
  };
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(`${KEY}-backup`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed?.id) return null;
    return { ...emptyProfile(), ...parsed };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
    window.localStorage.setItem(`${KEY}-backup`, JSON.stringify(profile));
  } catch {
    /* stockage indisponible */
  }
}

export function resetProfile() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(`${KEY}-backup`);
  }
}

/** Six niveaux progressifs, de l'oral jusqu'à la rédaction autonome. */
export function learningLevel(day: number) {
  return Math.min(6, Math.max(1, Math.ceil(day / 30)));
}

/** Met à jour l'état de maîtrise d'une compétence après une réponse. */
export function recordAnswer(profile: Profile, skillId: string, ok: boolean): Profile {
  const prev: SkillRecord =
    profile.skills[skillId] ??
    { id: skillId, state: "non_apprise", success: 0, fail: 0, lastSeen: "" };

  const success = prev.success + (ok ? 1 : 0);
  const fail = prev.fail + (ok ? 0 : 1);
  let idx = STATES.indexOf(prev.state);
  idx = ok ? Math.min(STATES.length - 1, idx + 1) : Math.max(0, idx - 1);

  const next: SkillRecord = {
    id: skillId,
    state: STATES[idx] ?? "non_apprise",
    success,
    fail,
    lastSeen: new Date().toISOString(),
  };

  return {
    ...profile,
    stars: profile.stars + (ok ? 1 : 0),
    skills: { ...profile.skills, [skillId]: next },
    pendingSync: true,
  };
}

export function masteredCount(profile: Profile) {
  return Object.values(profile.skills).filter(
    (s) => s.state === "maitrisee" || s.state === "consolidee",
  ).length;
}

export function progressPercent(profile: Profile) {
  const total = Object.keys(profile.skills).length;
  if (!total) return 0;
  return Math.round((masteredCount(profile) / total) * 100);
}
