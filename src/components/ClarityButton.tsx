import { useState } from "react";
import { CLARITY_PRESETS, getClarity, setClarity } from "@/lib/clarity";
import { speak } from "@/lib/speech";

/** Réglage de clarté : volume, vitesse et articulation de la voix. */
export function ClarityButton() {
  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState(() => getClarity().speed);

  function choose(index: number) {
    const preset = CLARITY_PRESETS[index]!;
    setClarity(preset.value);
    setSpeed(preset.value.speed);
    void speak(`Voilà. Je parle comme ça maintenant. Écoute bien : A... B... C.`);
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-warm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left text-lg font-bold text-card-foreground"
      >
        <span>🔊 Ma voix est-elle claire ?</span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="mt-3 grid gap-2">
          {CLARITY_PRESETS.map((preset, i) => (
            <button
              key={preset.id}
              onClick={() => choose(i)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-semibold ${
                Math.abs(speed - preset.value.speed) < 0.01
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {preset.icon}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
