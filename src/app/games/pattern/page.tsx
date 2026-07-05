"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Fraunces } from "next/font/google";
import { BackButton } from "@/components/layout/BackButton";
import { Plant } from "@/components/garden/Plant";
import { SOIL_PALETTE } from "@/components/garden/colour";
import { generatePuzzle, type Cell, type Puzzle, type PuzzleOption, type Tier } from "@/lib/pattern-engine";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const TIER: Tier = 2;
const FLIGHT_MS = 560;
const HOLD_CORRECT_MS = 850;
const HOLD_WRONG_MS = 1500;
const LEAVE_MS = 280;

type Phase = "choosing" | "flying" | "correct" | "wrong" | "leaving";

interface FlightState {
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  cell: Cell;
}

interface LedgeFlower {
  key: string;
  cell: Cell;
}

function plantSizeFor(totalSlots: number): number {
  if (totalSlots <= 4) return 88;
  if (totalSlots === 5) return 74;
  return 60;
}

// Deterministic jagged top edge for the grass-hint strip - not random per
// render, just a fixed silhouette (a sine wave read as blades).
function grassPath(width = 240, height = 18, blades = 34): string {
  let d = `M0,${height}`;
  for (let i = 0; i <= blades; i++) {
    const x = (i / blades) * width;
    const h = 5 + 6 * Math.abs(Math.sin(i * 2.4));
    d += ` L${x.toFixed(1)},${(height - h).toFixed(1)}`;
  }
  d += ` L${width},${height} Z`;
  return d;
}
const GRASS_PATH = grassPath();

function GrassEdge() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-4 w-full"
      viewBox="0 0 240 18"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={GRASS_PATH} fill="var(--color-secondary)" opacity={0.38} />
    </svg>
  );
}

const PETAL_SPECS = [
  { x: -20, y: -48, r: -35, c: "var(--color-primary)", delay: 0 },
  { x: 16, y: -56, r: 40, c: "var(--color-accent)", delay: 60 },
  { x: -32, y: -32, r: 15, c: "var(--color-secondary)", delay: 140 },
  { x: 28, y: -38, r: -20, c: "var(--color-primary)", delay: 90 },
  { x: 2, y: -60, r: 60, c: "var(--color-accent)", delay: 200 },
];

function Petals({ petalKey }: { petalKey: string }) {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      {PETAL_SPECS.map((p, i) => (
        <span
          key={`${petalKey}-${i}`}
          className="animate-petal-drift absolute left-1/2 top-1/2 block h-1.5 w-1.5 rounded-full"
          style={
            {
              backgroundColor: p.c,
              opacity: 0.75,
              "--petal-x": `${p.x}px`,
              "--petal-y": `${p.y}px`,
              "--petal-r": `${p.r}deg`,
              animationDelay: `${p.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function FlightClone({ flight, size }: { flight: FlightState; size: number }) {
  return (
    <div
      className="animate-plant-flight pointer-events-none fixed z-50 flex items-center justify-center"
      style={
        {
          left: flight.left,
          top: flight.top,
          width: flight.width,
          height: flight.height,
          "--dx": `${flight.dx}px`,
          "--dy": `${flight.dy}px`,
          "--flight-ms": `${FLIGHT_MS}ms`,
        } as CSSProperties
      }
    >
      <Plant
        species={flight.cell.species}
        colour={flight.cell.colour}
        count={flight.cell.count}
        growthStage={flight.cell.growthStage}
        size={size}
      />
    </div>
  );
}

export default function PatternGamePage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [phase, setPhase] = useState<Phase>("choosing");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plotFilled, setPlotFilled] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<"correct" | "wrong" | null>(null);
  const [ledge, setLedge] = useState<LedgeFlower[]>([]);
  const [flight, setFlight] = useState<FlightState | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const plotRef = useRef<HTMLDivElement | null>(null);
  const ledgeScrollRef = useRef<HTMLDivElement | null>(null);

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  // Puzzle generation is random, so it must only happen client-side, or the
  // server-rendered and hydrated markup would diverge. One-time init, not a
  // state sync, so it intentionally runs once.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPuzzle(generatePuzzle(TIER));
  }, []);

  useEffect(() => {
    const el = ledgeScrollRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [ledge.length]);

  function loadNext() {
    setPuzzle(generatePuzzle(TIER));
    setSelectedId(null);
    setPlotFilled(false);
    setLastOutcome(null);
    setFlight(null);
    setPhase("choosing");
  }

  function startLeaving() {
    setPhase("leaving");
    schedule(loadNext, LEAVE_MS);
  }

  function handleSelect(option: PuzzleOption) {
    if (!puzzle || phase !== "choosing") return;
    setSelectedId(option.id);

    if (option.isCorrect) {
      const btn = optionRefs.current.get(option.id);
      const plot = plotRef.current;
      if (btn && plot) {
        const b = btn.getBoundingClientRect();
        const p = plot.getBoundingClientRect();
        setFlight({
          left: b.left,
          top: b.top,
          width: b.width,
          height: b.height,
          dx: p.left + p.width / 2 - (b.left + b.width / 2),
          dy: p.top + p.height / 2 - (b.top + b.height / 2),
          cell: option.cell,
        });
      }
      setPhase("flying");
      schedule(() => {
        setFlight(null);
        setPlotFilled(true);
        setPhase("correct");
        setLastOutcome("correct");
        setLedge((prev) => [...prev, { key: `${puzzle.id}-${option.id}`, cell: option.cell }]);
        schedule(startLeaving, HOLD_CORRECT_MS);
      }, FLIGHT_MS);
    } else {
      setPhase("wrong");
      setLastOutcome("wrong");
      schedule(startLeaving, HOLD_WRONG_MS);
    }
  }

  const totalSlots = puzzle ? puzzle.visible.length + 1 : 4;
  const rowSize = plantSizeFor(totalSlots);
  const correctCell = puzzle?.options.find((o) => o.isCorrect)?.cell ?? null;

  const sceneGradient = useMemo(
    () =>
      `linear-gradient(180deg, #FFFCF7 0%, #FFF6E9 20%, #FDE9D0 34%, ${SOIL_PALETTE.light} 47%, ${SOIL_PALETTE.base} 74%, ${SOIL_PALETTE.dark} 100%)`,
    [],
  );

  return (
    <div
      className={`${fraunces.variable} relative flex min-h-full flex-1 flex-col overflow-hidden`}
      style={{ background: sceneGradient }}
    >
      <div
        className="bg-grain pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-28 left-1/2 z-0 h-72 w-[520px] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(244,162,97,0.42), rgba(244,162,97,0) 70%)",
        }}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 flex min-h-full flex-1 flex-col transition-all duration-300 ease-out ${
          phase === "leaving" ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          paddingTop: "max(0.9rem, env(safe-area-inset-top))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <header className="flex w-full items-center justify-between">
          <BackButton />
          <h1
            className="text-sm text-text/70"
            style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
          >
            Pattern Garden
          </h1>
        </header>

        <div
          ref={ledgeScrollRef}
          className="mt-3 flex w-full items-center gap-1 overflow-x-auto rounded-full px-3 py-1.5"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 100%)",
            boxShadow: "inset 0 1px 2px rgba(169,128,91,0.18)",
          }}
        >
          {ledge.length === 0 ? (
            <span className="whitespace-nowrap px-1 text-xs text-text-light/80">
              your garden grows here
            </span>
          ) : (
            ledge.map((f, i) => (
              <span key={f.key} className={i === ledge.length - 1 ? "animate-bloom-in shrink-0" : "shrink-0"}>
                <Plant
                  species={f.cell.species}
                  colour={f.cell.colour}
                  count={f.cell.count}
                  growthStage={f.cell.growthStage}
                  size={30}
                />
              </span>
            ))
          )}
        </div>

        <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-1">
          <svg
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hill-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SOIL_PALETTE.base} />
                <stop offset="55%" stopColor={SOIL_PALETTE.dark} />
                <stop offset="100%" stopColor={SOIL_PALETTE.deep} />
              </linearGradient>
            </defs>
            <path d="M0,100 L0,54 Q200,40 400,54 L400,100 Z" fill="url(#hill-fill)" />
          </svg>

          <div className="relative flex w-full items-end justify-center gap-1.5 py-4">
            <div
              className="pointer-events-none absolute inset-x-2 inset-y-3 -z-10 rounded-[50%] blur-2xl"
              style={{ background: `radial-gradient(ellipse at center, ${SOIL_PALETTE.dark}4d, transparent 72%)` }}
              aria-hidden="true"
            />
            {puzzle
              ? puzzle.visible.map((cell, i) => (
                  <Plant
                    key={i}
                    species={cell.species}
                    colour={cell.colour}
                    count={cell.count}
                    growthStage={cell.growthStage}
                    size={rowSize}
                  />
                ))
              : Array.from({ length: 3 }).map((_, i) => <Plant key={i} size={rowSize} />)}

            <div
              ref={plotRef}
              key={plotFilled ? `plot-filled-${puzzle?.id}` : `plot-empty-${puzzle?.id}`}
              className={`relative flex items-center justify-center ${plotFilled ? "animate-bloom-in" : ""}`}
            >
              {plotFilled && (
                <>
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="animate-gentle-beat h-14 w-14 rounded-full bg-success/40" />
                  </span>
                  <Petals petalKey={puzzle?.id ?? "p"} />
                </>
              )}
              <Plant
                species={plotFilled && correctCell ? correctCell.species : undefined}
                colour={plotFilled && correctCell ? correctCell.colour : undefined}
                count={plotFilled && correctCell ? correctCell.count : undefined}
                growthStage={plotFilled && correctCell ? correctCell.growthStage : undefined}
                size={rowSize}
              />
            </div>
          </div>

          <p
            className="h-5 text-center text-sm text-text-light transition-opacity duration-300"
            style={{ opacity: lastOutcome ? 1 : 0 }}
            aria-live="polite"
          >
            {lastOutcome === "correct"
              ? "lovely - it took root."
              : lastOutcome === "wrong"
                ? "not quite - here's the one that fits."
                : ""}
          </p>
        </main>

        <div className="relative mt-auto">
          <GrassEdge />
          <div
            className="absolute inset-x-0 bottom-0 top-3 rounded-t-[28px]"
            style={{
              background: "linear-gradient(180deg, #FFF2E0 0%, #FBE3C5 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
            aria-hidden="true"
          />
          <div
            className="relative grid w-full grid-cols-3 gap-3 px-2 pt-5"
            style={{ paddingBottom: "max(1.1rem, env(safe-area-inset-bottom))" }}
          >
            {(puzzle?.options ?? []).map((option) => {
              const isSelected = option.id === selectedId;
              const wobble = phase === "wrong" && isSelected;
              const reveal = phase === "wrong" && option.isCorrect;
              const dim = phase === "wrong" && !isSelected && !option.isCorrect;
              const settled = phase === "flying" || phase === "correct";
              const uprooted = settled && isSelected;
              const fadeOthers = settled && !isSelected;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={phase !== "choosing"}
                  onClick={() => handleSelect(option)}
                  aria-label="Plant this seedling"
                  ref={(el) => {
                    if (el) optionRefs.current.set(option.id, el);
                    else optionRefs.current.delete(option.id);
                  }}
                  className={[
                    "relative flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all duration-300 ease-out",
                    "ring-1 ring-[#EBD2AE]/70",
                    wobble ? "animate-seed-wobble" : "",
                    reveal ? "animate-reveal-pulse ring-2 ring-success/50" : "",
                    dim ? "opacity-40" : "",
                    uprooted ? "scale-90 opacity-0" : "",
                    fadeOthers ? "scale-95 opacity-30" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    minHeight: rowSize + 32,
                    background: "linear-gradient(180deg, #FFFFFF 0%, #FBEBD6 100%)",
                    boxShadow: "0 2px 6px rgba(120,80,40,0.10)",
                  }}
                >
                  <Plant
                    species={option.cell.species}
                    colour={option.cell.colour}
                    count={option.cell.count}
                    growthStage={option.cell.growthStage}
                    size={rowSize}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {flight && <FlightClone flight={flight} size={rowSize} />}
    </div>
  );
}
