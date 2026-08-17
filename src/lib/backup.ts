// Sauvegarde et récupération du parcours, hors connexion.

import { emptyProfile, saveProfile, type Profile } from "./store";

/** Télécharge le parcours dans un petit fichier à garder sur le téléphone. */
export function exportProfile(profile: Profile) {
  const data = JSON.stringify({ app: "nnvle-declic", version: 1, profile }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (profile.name || "apprenant").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  a.href = url;
  a.download = `nnvle-declic-${safe}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Petit code de récupération : le parcours compressé en texte à recopier. */
export function toRecoveryCode(profile: Profile) {
  const json = JSON.stringify(profile);
  if (typeof window === "undefined") return "";
  return window.btoa(encodeURIComponent(json));
}

export function fromRecoveryCode(code: string): Profile | null {
  try {
    const json = decodeURIComponent(window.atob(code.trim()));
    const parsed = JSON.parse(json) as Profile;
    if (!parsed?.id) return null;
    return { ...emptyProfile(), ...parsed };
  } catch {
    return null;
  }
}

export async function importProfileFile(file: File): Promise<Profile | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as { profile?: Profile } | Profile;
    const profile = (parsed as { profile?: Profile }).profile ?? (parsed as Profile);
    if (!profile?.id) return null;
    const restored = { ...emptyProfile(), ...profile };
    saveProfile(restored);
    return restored;
  } catch {
    return null;
  }
}
