// Rappel quotidien de la séance de 15 minutes, sans Internet.

const KEY = "nnvle-reminder-v1";

export type Reminder = { enabled: boolean; hour: number; minute: number; lastFired: string };

export function loadReminder(): Reminder {
  if (typeof window === "undefined") return { enabled: false, hour: 18, minute: 0, lastFired: "" };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { enabled: false, hour: 18, minute: 0, lastFired: "", ...JSON.parse(raw) };
  } catch {
    /* stockage indisponible */
  }
  return { enabled: false, hour: 18, minute: 0, lastFired: "" };
}

export function saveReminder(r: Reminder) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* stockage indisponible */
  }
}

export async function askPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

/** Vérifie l'heure et déclenche le rappel une seule fois par jour. */
export function checkReminder() {
  const r = loadReminder();
  if (!r.enabled) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (r.lastFired === today) return;
  const due = now.getHours() > r.hour || (now.getHours() === r.hour && now.getMinutes() >= r.minute);
  if (!due) return;
  saveReminder({ ...r, lastFired: today });
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("N'nvlé Déclic", {
        body: "C'est l'heure de ta séance de 15 minutes. On y va ensemble !",
        icon: "/favicon.png",
      });
    }
  } catch {
    /* notifications indisponibles */
  }
}
