import { useEffect, useRef, useState } from "react";
import { strokesFor } from "@/lib/letters";

type Props = {
  target: string;
  onResult: (ok: boolean) => void;
};

/** Écriture guidée : le modèle se trace tout seul (bon sens, bonne forme),
 *  puis l'apprenant repasse au doigt et l'application corrige. */
export function GuidedWriting({ target, onResult }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const points = useRef<Array<{ x: number; y: number }>>([]);
  const [hasInk, setHasInk] = useState(false);
  const [replay, setReplay] = useState(0);
  const strokes = strokesFor(target);

  useEffect(() => {
    clear();
    setReplay((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  function clear() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    points.current = [];
    setHasInk(false);
  }

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const p = pos(e);
    points.current.push(p);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const p = pos(e);
    points.current.push(p);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  }

  function end() {
    drawing.current = false;
  }

  function validate() {
    const pts = points.current;
    if (pts.length < 12) {
      onResult(false);
      return;
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const c = canvasRef.current!;
    const ok = w > c.width * 0.12 && h > c.height * 0.35;
    onResult(ok);
  }

  return (
    <div>
      <div className="relative mx-auto w-full max-w-sm">
        {/* Le modèle animé : chaque geste se dessine dans le bon sens */}
        <svg
          key={replay}
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {strokes.map((d, i) => (
            <g key={`${target}-${i}`}>
              <path d={d} fill="none" stroke="rgba(194,65,12,0.15)" strokeWidth={9} strokeLinecap="round" />
              <path
                d={d}
                fill="none"
                stroke="rgba(13,148,136,0.9)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="200"
                className="animate-trace"
                style={{ animationDelay: `${i * 1.1}s` }}
              />
            </g>
          ))}
        </svg>
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-72 w-full touch-none rounded-3xl border-4 border-dashed border-primary/40 bg-card"
        />
      </div>
      <p className="mt-2 text-base text-muted-foreground">
        Suis le trait vert : il montre par où commencer et dans quel sens aller.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setReplay((n) => n + 1)}
          className="rounded-full bg-accent px-5 py-3 text-lg font-bold text-accent-foreground"
        >
          👀 Montre-moi
        </button>
        <button
          onClick={clear}
          className="rounded-full bg-secondary px-5 py-3 text-lg font-semibold text-secondary-foreground"
        >
          🧽 Effacer
        </button>
        <button
          onClick={validate}
          disabled={!hasInk}
          className="rounded-full bg-primary px-6 py-3 text-lg font-bold text-primary-foreground disabled:opacity-40"
        >
          ✅ J'ai fini
        </button>
      </div>
    </div>
  );
}
