"use client";

import { useEffect, useRef, useState } from "react";
import { Fraunces } from "next/font/google";
import { BackButton } from "@/components/layout/BackButton";
import { Plant } from "@/components/garden/Plant";
import { generatePuzzle, type Puzzle, type PuzzleOption, type Tier } from "@/lib/pattern-engine";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const TIER: Tier = 2;
const HOLD_CORRECT_MS = 1000;
const HOLD_WRONG_MS = 1500;
const LEAVE_MS = 280;

type Phase = "choosing" | "correct" | "wrong" | "leaving";

function plantSizeFor(totalSlots: number): number {
  if (totalSlots <= 4) return 64;
  if (totalSlots === 5) return 54;
  return 46;
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 19c-1-6 2-13 14-14 1 12-6 15-14 14Z"
        fill="currentColor"
        opacity={0.85}
      />
      <path d="M6 18C10 14 13 10 18.5 5.5" stroke="var(--color-surface)" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
    </svg>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  return (
    <span
      className={`flex items-center gap-1 text-sm font-medium text-text-light transition-opacity duration-300 ${
        streak > 0 ? "opacity-100" : "opacity-0"
      }`}
      aria-label={streak > 0 ? `${streak} in a row` : undefined}
      aria-hidden={streak === 0}
    >
      <LeafIcon className="h-4 w-4 text-secondary" />
      {streak}
    </span>
  );
}

export default function PatternGamePage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [phase, setPhase] = useState<Phase>("choosing");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plotFilled, setPlotFilled] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  function loadNext() {
    setPuzzle(generatePuzzle(TIER));
    setSelectedId(null);
    setPlotFilled(false);
    setLastOutcome(null);
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
      setPhase("correct");
      setLastOutcome("correct");
      setPlotFilled(true);
      setStreak((s) => s + 1);
      schedule(startLeaving, HOLD_CORRECT_MS);
    } else {
      setPhase("wrong");
      setLastOutcome("wrong");
      setStreak(0);
      schedule(startLeaving, HOLD_WRONG_MS);
    }
  }

  const totalSlots = puzzle ? puzzle.visible.length + 1 : 4;
  const rowSize = plantSizeFor(totalSlots);
  const correctCell = puzzle?.options.find((o) => o.isCorrect)?.cell ?? null;

  return (
    <div
      className={`${fraunces.variable} flex min-h-full flex-1 flex-col`}
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <header className="flex w-full items-center justify-between">
        <BackButton />
        <StreakBadge streak={streak} />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-1 py-6">
        <h1
          className="text-center text-xl text-text"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
        >
          Pattern Garden
        </h1>

        <div
          className={`flex w-full flex-col items-center gap-7 transition-all duration-300 ease-out ${
            phase === "leaving" ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <div className="w-full rounded-card bg-surface p-4 shadow-sm">
            <div className="flex items-end justify-center gap-2">
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
                key={plotFilled ? `plot-filled-${puzzle?.id}` : `plot-empty-${puzzle?.id}`}
                className={`relative flex items-center justify-center ${plotFilled ? "animate-bloom-in" : ""}`}
              >
                {plotFilled && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="animate-gentle-beat h-14 w-14 rounded-full bg-success/40" />
                  </span>
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

          <div className="grid w-full grid-cols-3 gap-3">
            {(puzzle?.options ?? []).map((option) => {
              const isSelected = option.id === selectedId;
              const wobble = phase === "wrong" && isSelected;
              const reveal = phase === "wrong" && option.isCorrect;
              const dim = phase === "wrong" && !isSelected && !option.isCorrect;
              const uprooted = phase === "correct" && isSelected;
              const fadeOthers = phase === "correct" && !isSelected;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={phase !== "choosing"}
                  onClick={() => handleSelect(option)}
                  aria-label="Plant this seedling"
                  className={[
                    "flex min-h-[44px] flex-col items-center justify-center rounded-card bg-surface p-2 shadow-sm transition-all duration-300 ease-out",
                    wobble ? "animate-seed-wobble" : "",
                    reveal ? "animate-reveal-pulse ring-2 ring-success/50" : "",
                    dim ? "opacity-40" : "",
                    uprooted ? "scale-90 opacity-0" : "",
                    fadeOthers ? "scale-95 opacity-30" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Plant
                    species={option.cell.species}
                    colour={option.cell.colour}
                    count={option.cell.count}
                    growthStage={option.cell.growthStage}
                    size={76}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
