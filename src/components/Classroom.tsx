import type { ReactNode } from "react";

export type Pose = "point" | "happy" | "listen";

const IMAGES: Record<Pose, string> = {
  point: "/prof-point.png",
  happy: "/prof-happy.png",
  listen: "/prof-listen.png",
};

/** La salle de classe : le tableau, l'enseignant animé et son bâton. */
export function Classroom({
  line,
  pose = "point",
  speaking,
  onRepeat,
  showTranscript = false,
  children,
}: {
  line: string;
  pose?: Pose;
  speaking?: boolean;
  onRepeat?: () => void;
  showTranscript?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {/* Le tableau noir */}
      <div className="relative overflow-hidden rounded-3xl border-8 border-[#8a5a2b] bg-[#2f5d4a] p-4 shadow-warm">
        <div className="min-h-[190px] text-center text-white">{children}</div>

        {/* Le bâton de l'enseignant, qui montre ce qui est écrit */}
        <div
          className={`pointer-events-none absolute bottom-3 right-3 h-40 w-2 origin-bottom rounded-full bg-[#c9a06a] transition-transform duration-300 ${
            pose === "point" ? (speaking ? "animate-point-tap" : "rotate-[35deg]") : "rotate-[70deg] translate-y-2 opacity-50"
          }`}
        />
      </div>

      {/* L'enseignant + sa parole */}
      <div className="flex items-end gap-3 rounded-3xl bg-card p-3 shadow-warm">
        <div className="relative w-28 shrink-0 sm:w-32">
          <img
            src={IMAGES[pose]}
            alt="Ton enseignant, Inocent KOFFI"
            className={`w-full rounded-2xl object-cover ${speaking ? "animate-teacher-talk" : "animate-teacher-idle"}`}
          />
          {speaking ? (
            <span className="absolute -right-1 top-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              🔊
            </span>
          ) : null}
        </div>
        <div className="flex-1 pb-1">
          {showTranscript ? (
            <div className="relative rounded-2xl bg-secondary p-3">
              <p className="text-xl leading-snug font-semibold text-secondary-foreground">{line}</p>
            </div>
          ) : (
            <p className="sr-only" aria-live="polite">{line}</p>
          )}
          {onRepeat ? (
            <button
              onClick={onRepeat}
              className="mt-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground" aria-label="Réécouter" title="Réécouter"
            >
              🔁
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
