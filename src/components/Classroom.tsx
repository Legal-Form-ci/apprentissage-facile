import type { ReactNode } from "react";

export type Pose = "point" | "happy" | "listen";

const IMAGES: Record<Pose, string> = {
  point: "/prof-point.jpg",
  happy: "/prof-happy.jpg",
  listen: "/prof-listen.jpg",
};

/** La salle de classe : le tableau, l'enseignant animé et son bâton. */
export function Classroom({
  line,
  pose = "point",
  speaking,
  onRepeat,
  children,
}: {
  line: string;
  pose?: Pose;
  speaking?: boolean;
  onRepeat?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {/* Le tableau noir */}
      <div className="relative overflow-hidden rounded-3xl border-8 border-[#8a5a2b] bg-[#2f5d4a] p-4 shadow-warm">
        <div className="min-h-[190px] text-center text-white">{children}</div>

        {/* Le bâton de l'enseignant, qui montre ce qui est écrit */}
        <div
          className={`pointer-events-none absolute bottom-3 right-3 h-40 w-2 origin-bottom rounded-full bg-[#c9a06a] ${
            speaking ? "animate-point-tap" : "rotate-[35deg]"
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
          <div className="relative rounded-2xl bg-secondary p-3">
            <p className="text-xl leading-snug font-semibold text-secondary-foreground">{line}</p>
          </div>
          {onRepeat ? (
            <button
              onClick={onRepeat}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-base font-bold text-accent-foreground"
            >
              🔁 Redis-moi
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
