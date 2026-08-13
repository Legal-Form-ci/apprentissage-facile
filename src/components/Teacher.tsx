import logo from "@/assets/envledeclic-logo.png.asset.json";

type Props = {
  line: string;
  speaking?: boolean;
  onRepeat?: () => void;
};

export function Teacher({ line, speaking, onRepeat }: Props) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-warm">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className={`h-24 w-24 overflow-hidden rounded-full bg-secondary ring-4 ring-primary/30 ${
              speaking ? "animate-pulse-soft" : ""
            }`}
          >
            <img
              src={logo.url}
              alt="Ton enseignant"
              className="h-full w-full scale-[1.5] object-cover object-top"
            />
          </div>
          {speaking ? (
            <span className="absolute -right-1 bottom-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              🔊
            </span>
          ) : null}
        </div>
        <div className="flex-1">
          <p className="text-2xl leading-snug font-semibold text-card-foreground">{line}</p>
          {onRepeat ? (
            <button
              onClick={onRepeat}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-base font-semibold text-secondary-foreground"
            >
              🔁 Réécouter
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
