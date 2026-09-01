// Réduction du bruit : mode automatique qui s'adapte au niveau sonore mesuré,
// plus un test de micro et de latence avant la séance.

import { micLevel, primeMic } from "./speech";

export type NoiseMode = "auto" | "fort" | "leger" | "off";

const KEY = "nnvle-noise-v1";

let mode: NoiseMode | null = null;
/** Bruit de fond mesuré (0..1). Mis à jour pendant la séance en mode auto. */
let ambient = 0.04;
let watcher: number | null = null;

export function getNoiseMode(): NoiseMode {
  if (mode) return mode;
  if (typeof window === "undefined") return "auto";
  try {
    mode = (window.localStorage.getItem(KEY) as NoiseMode) || "auto";
  } catch {
    mode = "auto";
  }
  return mode;
}

export function setNoiseMode(next: NoiseMode) {
  mode = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* stockage indisponible */
  }
}

export function ambientLevel() {
  return ambient;
}

/** Seuil de détection de voix, adapté au bruit ambiant mesuré. */
export function voiceThreshold(): number {
  const m = getNoiseMode();
  if (m === "off") return 0.06;
  if (m === "fort") return 0.22;
  if (m === "leger") return 0.12;
  // auto : on reste juste au-dessus du bruit de fond, dans des bornes sûres
  return Math.min(0.3, Math.max(0.09, ambient * 1.9 + 0.05));
}

/** Mesure le bruit de fond pendant quelques instants (l'apprenant se tait). */
export async function measureAmbient(ms = 1200): Promise<number> {
  const ok = await primeMic();
  if (!ok) return ambient;
  const readings: number[] = [];
  const started = Date.now();
  while (Date.now() - started < ms) {
    readings.push(micLevel());
    await new Promise((r) => setTimeout(r, 80));
  }
  readings.sort((a, b) => a - b);
  const median = readings[Math.floor(readings.length / 2)] ?? ambient;
  ambient = median;
  return ambient;
}

/**
 * Surveillance automatique : pendant toute la séance, on suit le niveau
 * sonore et on ajuste l'intensité de la réduction du bruit en continu.
 */
export function startNoiseWatch() {
  if (typeof window === "undefined" || watcher !== null) return;
  void primeMic();
  const samples: number[] = [];
  watcher = window.setInterval(() => {
    const level = micLevel();
    samples.push(level);
    if (samples.length > 60) samples.shift();
    // le bruit de fond, c'est le niveau bas et régulier (10e centile)
    const sorted = [...samples].sort((a, b) => a - b);
    const floor = sorted[Math.floor(sorted.length * 0.15)] ?? level;
    ambient = ambient * 0.8 + floor * 0.2;
  }, 250);
}

export function stopNoiseWatch() {
  if (watcher !== null) {
    window.clearInterval(watcher);
    watcher = null;
  }
}

export type MicTest = {
  ok: boolean;
  /** niveau de voix mesuré (0..1) */
  level: number;
  /** bruit de fond mesuré (0..1) */
  noise: number;
  /** délai avant la première détection de voix, en millisecondes */
  latencyMs: number;
  verdict: "excellent" | "bon" | "bruyant" | "muet";
};

/** Test de micro et de latence : l'apprenant parle, on mesure. */
export async function runMicTest(speakMs = 3000): Promise<MicTest> {
  const noise = await measureAmbient(900);
  const ok = await primeMic();
  if (!ok) return { ok: false, level: 0, noise, latencyMs: 0, verdict: "muet" };
  const start = Date.now();
  let peak = 0;
  let latencyMs = 0;
  const threshold = Math.max(0.1, noise * 2 + 0.05);
  while (Date.now() - start < speakMs) {
    const level = micLevel();
    if (level > peak) peak = level;
    if (!latencyMs && level > threshold) latencyMs = Date.now() - start;
    await new Promise((r) => setTimeout(r, 60));
  }
  const verdict: MicTest["verdict"] =
    peak < threshold ? "muet" : noise > 0.16 ? "bruyant" : peak > 0.35 ? "excellent" : "bon";
  return { ok: true, level: peak, noise, latencyMs: latencyMs || speakMs, verdict };
}
