"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Fraunces } from "next/font/google";
import { BackButton } from "@/components/layout/BackButton";
import { Plant } from "@/components/garden/Plant";
import { Cat, type CatMood } from "@/components/garden/Cat";
import { GardenView } from "@/components/garden/GardenView";
import { SOIL_PALETTE, darken, lighten } from "@/components/garden/colour";
import { generatePuzzle, type Cell, type Puzzle, type PuzzleOption, type Tier } from "@/lib/pattern-engine";
import { getStoredValue, setStoredValue } from "@/lib/storage";
import {
  DEFAULT_PATTERN_GARDEN_STATE,
  PATTERN_GARDEN_KEY,
  recordCorrectAnswer,
  recordWrongAnswer,
  sanitizeGardenState,
  tierNumberFor,
  type PatternGardenState,
} from "@/lib/pattern-garden-storage";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const FLIGHT_MS = 560;
const HOLD_CORRECT_MS = 850;
const HOLD_WRONG_MS = 1500;
const LEAVE_MS = 280;

// How long the resident cat stays perked up after a bloom lands before she
// settles back into her nap. She only ever reacts to something taking root -
// never to a wrong answer - so this timer is only ever started on success.
const CAT_ALERT_MS = 2600;

// No visible timer, ever - just a slow ambient warmth that settles in once
// she's been sitting with a puzzle a while. Fires well before the ~60-70s
// pacing target so it reads as the garden's light drifting, not a deadline.
const AMBIENT_CUE_DELAY_MS = 45_000;
const AMBIENT_CUE_FADE_MS = 9_000;

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

// The empty plot is a "mystery" cell - it doesn't need to be read at a
// glance, so it renders smaller than the real sequence plants, freeing
// width for the cells that actually carry the pattern. Sizes are tuned to
// the widest they can go without the row's flex-shrink kicking in and
// squashing the flowers on a 390px phone (measured row budget: ~350px).
function sequenceSizeFor(visibleCount: number): number {
  if (visibleCount <= 3) return 96;
  if (visibleCount === 4) return 74;
  return 58;
}

// Each option sits inside a padded card in a 3-column grid (measured: ~103px
// column on a 390px phone). The flower should fill that column, not float in
// a small box surrounded by card padding.
function optionSizeFor(count: number): number {
  if (count <= 3) return 128;
  return 104;
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

// A few soft, static blades rising from the planter rim, scattered behind the
// sequence row - fills the open air above the planter with garden texture
// instead of bare cream, without competing with the flowers for attention.
const WISP_SPECS = [
  { x: 6, h: 46, w: 5, lean: -4, o: 0.22 },
  { x: 20, h: 30, w: 4, lean: 5, o: 0.16 },
  { x: 60, h: 52, w: 5, lean: 3, o: 0.2 },
  { x: 82, h: 34, w: 4, lean: -5, o: 0.15 },
  { x: 94, h: 44, w: 5, lean: 4, o: 0.2 },
];

function GrassWisps() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-3 z-0"
      style={{ bottom: "15dvh", height: 60 }}
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {WISP_SPECS.map((w, i) => (
        <path
          key={i}
          d={`M${w.x - w.w / 2},60 Q${w.x + w.lean},${60 - w.h * 0.6} ${w.x + w.lean},${60 - w.h} Q${w.x + w.lean * 1.4},${60 - w.h * 0.6} ${w.x + w.w / 2},60 Z`}
          fill="var(--color-secondary)"
          opacity={w.o}
        />
      ))}
    </svg>
  );
}

// The engine is untouched - this just retries a few times, client-side, for
// the puzzle with the fewest cells (prefers 4 slots over 5+) so each plant
// gets more width on screen.
function generateCompactPuzzle(tier: Tier): Puzzle {
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generatePuzzle(tier);
    if (candidate.visible.length + 1 <= 4) return candidate;
    if (!best || candidate.visible.length < best.visible.length) best = candidate;
  }
  return best as Puzzle;
}

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

// No visible timer, ever - remounted fresh for every puzzle (via `key`), so
// it always starts cool and only drifts warmer if she's still sitting with
// the same puzzle once the delay elapses. Purely ambient: a slow fade she'd
// only notice in hindsight, never a cue that demands a response.
function AmbientWarmth() {
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWarm(true), AMBIENT_CUE_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(247,190,120,0) 0%, rgba(240,150,90,0.14) 55%, rgba(226,110,64,0.22) 100%)",
        opacity: warm ? 1 : 0,
        transition: `opacity ${AMBIENT_CUE_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
      aria-hidden="true"
    />
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
  const [garden, setGarden] = useState<PatternGardenState>(DEFAULT_PATTERN_GARDEN_STATE);
  const [isGardenOpen, setIsGardenOpen] = useState(false);
  const [catMood, setCatMood] = useState<CatMood>("napping");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const plotRef = useRef<HTMLDivElement | null>(null);
  const ledgeScrollRef = useRef<HTMLDivElement | null>(null);
  // Mirrors `garden` synchronously so scheduled callbacks (loadNext, fired
  // via setTimeout) always read the just-recorded answer instead of a stale
  // pre-setState closure.
  const gardenRef = useRef<PatternGardenState>(DEFAULT_PATTERN_GARDEN_STATE);

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  function persistGarden(next: PatternGardenState) {
    gardenRef.current = next;
    setGarden(next);
    setStoredValue(PATTERN_GARDEN_KEY, next);
  }

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  // Puzzle generation is random, so it must only happen client-side, or the
  // server-rendered and hydrated markup would diverge. Loading the saved
  // garden happens in the same one-time effect so the very first puzzle
  // already reflects her saved difficulty, not a default.
  useEffect(() => {
    const loaded = sanitizeGardenState(getStoredValue<unknown>(PATTERN_GARDEN_KEY, null));
    gardenRef.current = loaded;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGarden(loaded);
    setPuzzle(generateCompactPuzzle(tierNumberFor(loaded.currentDifficulty)));
  }, []);

  useEffect(() => {
    const el = ledgeScrollRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [ledge.length]);

  function loadNext() {
    setPuzzle(generateCompactPuzzle(tierNumberFor(gardenRef.current.currentDifficulty)));
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
        persistGarden(recordCorrectAnswer(gardenRef.current, option.cell));
        setCatMood("alert");
        schedule(() => setCatMood("napping"), CAT_ALERT_MS);
        schedule(startLeaving, HOLD_CORRECT_MS);
      }, FLIGHT_MS);
    } else {
      setPhase("wrong");
      setLastOutcome("wrong");
      persistGarden(recordWrongAnswer(gardenRef.current));
      schedule(startLeaving, HOLD_WRONG_MS);
    }
  }

  const visibleCount = puzzle ? puzzle.visible.length : 3;
  const seqSize = sequenceSizeFor(visibleCount);
  const emptySize = Math.round(seqSize * 0.55);
  const plotSize = plotFilled ? seqSize : emptySize;
  const optionSize = optionSizeFor(puzzle?.options.length ?? 3);
  const correctCell = puzzle?.options.find((o) => o.isCorrect)?.cell ?? null;

  const sceneGradient = useMemo(
    () =>
      `linear-gradient(180deg, #FFFCF7 0%, #FFF6E9 22%, #FDE9D0 42%, #FBDFC0 62%, #F7D3AC 100%)`,
    [],
  );

  const successPill = useMemo(
    () => ({ bg: lighten("#81C784", 0.78), text: darken("#3F8E45", 0.05) }),
    [],
  );
  const wrongPill = useMemo(
    () => ({ bg: lighten(SOIL_PALETTE.base, 0.72), text: darken(SOIL_PALETTE.dark, 0.15) }),
    [],
  );

  return (
    <div
      className={`${fraunces.variable} relative flex min-h-dvh flex-1 flex-col overflow-hidden`}
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
      {puzzle && <AmbientWarmth key={puzzle.id} />}

      <div
        className={`relative z-10 flex min-h-dvh flex-1 flex-col transition-all duration-300 ease-out ${
          phase === "leaving" ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {/* Top zone: back button, title, session ledge - ~15% of the screen */}
        <div
          className="shrink-0"
          style={{ paddingTop: "max(0.9rem, env(safe-area-inset-top))" }}
        >
          <header className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2">
            <BackButton />
            <h1
              className="text-center text-sm text-text/70"
              style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
            >
              Pattern Garden
            </h1>
            <button
              type="button"
              onClick={() => setIsGardenOpen(true)}
              aria-label="Open your garden"
              className="flex h-8 w-8 items-center justify-center justify-self-end rounded-full transition-transform active:scale-95"
              style={{ background: "rgba(255,255,255,0.55)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4.5" fill="var(--color-primary)" opacity={0.85} />
                <path
                  d="M12 12.2 V21"
                  stroke="var(--color-secondary)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <path
                  d="M12 17.5 Q7.5 17.5 6 21"
                  stroke="var(--color-secondary)"
                  strokeWidth={1.8}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
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
        </div>

        {/* Middle zone: the sequence in its shallow planter - the big, legible hero */}
        <div className="relative flex min-h-0 flex-col justify-end" style={{ flexGrow: 1, flexBasis: 0 }}>
          <div
            className="absolute inset-x-3 bottom-0 rounded-t-[26px]"
            style={{
              height: "15dvh",
              minHeight: 72,
              background: `linear-gradient(180deg, ${SOIL_PALETTE.light} 0%, ${SOIL_PALETTE.base} 45%, ${SOIL_PALETTE.dark} 100%)`,
              boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -10px 18px ${SOIL_PALETTE.deep}55`,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-3 z-0 rounded-t-[26px]"
            style={{ bottom: "15dvh", height: 10, background: SOIL_PALETTE.deep, opacity: 0.18 }}
            aria-hidden="true"
          />
          <GrassWisps />
          <div
            className="pointer-events-none absolute right-4 z-10"
            style={{ bottom: "calc(15dvh - 4px)" }}
          >
            <Cat mood={catMood} size={42} />
          </div>

          <div
            className="relative z-10 mx-auto flex w-full max-w-md items-end justify-center gap-1"
            style={{ marginBottom: "6dvh" }}
          >
            {puzzle
              ? puzzle.visible.map((cell, i) => (
                  <Plant
                    key={i}
                    species={cell.species}
                    colour={cell.colour}
                    count={cell.count}
                    growthStage={cell.growthStage}
                    size={seqSize}
                  />
                ))
              : Array.from({ length: 3 }).map((_, i) => <Plant key={i} size={seqSize} />)}

            <div
              ref={plotRef}
              key={plotFilled ? `plot-filled-${puzzle?.id}` : `plot-empty-${puzzle?.id}`}
              className={`relative flex items-end justify-center ${plotFilled ? "animate-bloom-in" : ""}`}
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
                size={plotSize}
              />
            </div>
          </div>
        </div>

        {/* Slim feedback band, always reserved so nothing shifts when it appears */}
        <div className="flex shrink-0 items-center justify-center px-4" style={{ minHeight: 44 }}>
          {lastOutcome && (
            <p
              className={`rounded-full px-4 py-1.5 text-center text-sm font-semibold ${
                lastOutcome === "correct" ? "animate-bloom-in" : "animate-fade-settle-in"
              }`}
              style={{
                background: lastOutcome === "correct" ? successPill.bg : wrongPill.bg,
                color: lastOutcome === "correct" ? successPill.text : wrongPill.text,
              }}
              aria-live="polite"
            >
              {lastOutcome === "correct" ? "lovely - it took root" : "not this time - here's the one that fits"}
            </p>
          )}
        </div>

        {/* Bottom zone: seedling choices, thumb-friendly - ~30% of the screen */}
        <div className="relative flex min-h-0 flex-col justify-center" style={{ flexGrow: 1.6, flexBasis: 0 }}>
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
            className="relative mx-auto grid w-full max-w-md grid-cols-3 gap-3 px-3 py-6"
            style={{ paddingBottom: "max(1.6rem, env(safe-area-inset-bottom))" }}
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
                    "relative flex flex-col items-center justify-center gap-2 rounded-2xl p-2 transition-all duration-300 ease-out",
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
                    minHeight: optionSize + 24,
                    background: "linear-gradient(180deg, #FFFFFF 0%, #FBEBD6 100%)",
                    boxShadow: "0 2px 6px rgba(120,80,40,0.10)",
                  }}
                >
                  <Plant
                    species={option.cell.species}
                    colour={option.cell.colour}
                    count={option.cell.count}
                    growthStage={option.cell.growthStage}
                    size={optionSize}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {flight && <FlightClone flight={flight} size={seqSize} />}
      {isGardenOpen && (
        <GardenView
          items={garden.gardenItems}
          bestStreak={garden.bestStreak}
          onClose={() => setIsGardenOpen(false)}
        />
      )}
    </div>
  );
}
