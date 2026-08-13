import { useEffect, useRef, useState } from "react";

type Props = {
  target: string;
  onResult: (ok: boolean) => void;
};

/** Moteur d'écriture simplifié : l'apprenant trace au doigt, on mesure
 *  la couverture du modèle affiché en filigrane. */
export function WritingCanvas({ target, onResult }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const points = useRef<Array<{ x: number; y: number }>>([]);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
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
    // le tracé doit occuper une bonne partie de la zone du modèle
    const ok = w > c.width * 0.15 && h > c.height * 0.35;
    onResult(ok);
  }

  return (
    <div>
      <div className="relative mx-auto w-full max-w-sm">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[10rem] leading-none text-primary/15 select-none">
            {target}
          </span>
        </div>
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
      <div className="mt-4 flex justify-center gap-3">
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
