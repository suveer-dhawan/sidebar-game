"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/layout/BackButton";
import {
  COLOUR_HEX,
  COLOUR_LABEL,
  GROWTH_LABEL,
  SPECIES_EMOJI,
  SPECIES_LABEL,
  generateBatch,
  type Cell,
  type Tier,
  type Puzzle,
} from "@/lib/pattern-engine";

const TIERS: Tier[] = [1, 2, 3, 4, 5];
const BATCH_SIZE = 8;

const GROWTH_SCALE: Record<Cell["growthStage"], string> = {
  bud: "scale-75 opacity-60",
  "half-open": "scale-90 opacity-80",
  "full-bloom": "scale-100 opacity-100",
};

function CellToken({ cell, size = "md" }: { cell: Cell; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-20 w-20 text-2xl" : "h-16 w-16 text-lg";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex ${dims} items-center justify-center rounded-full ${GROWTH_SCALE[cell.growthStage]} transition-transform`}
        style={{ backgroundColor: COLOUR_HEX[cell.colour] }}
        title={`${SPECIES_LABEL[cell.species]}, ${COLOUR_LABEL[cell.colour]}, ${cell.count}, ${GROWTH_LABEL[cell.growthStage]}`}
      >
        <span className="leading-none">{SPECIES_EMOJI[cell.species].repeat(cell.count)}</span>
      </div>
      <div className="text-center text-[10px] leading-tight text-text-light">
        <div>
          {SPECIES_LABEL[cell.species]} · {COLOUR_LABEL[cell.colour]}
        </div>
        <div>
          count {cell.count} · {GROWTH_LABEL[cell.growthStage]}
        </div>
      </div>
    </div>
  );
}

function PuzzleCard({ puzzle, index }: { puzzle: Puzzle; index: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text">Puzzle {index + 1}</h2>
        <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium text-text-light">
          tier {puzzle.tier} · {puzzle.governedProperties.length} governed · {puzzle.visible.length} visible
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {puzzle.visible.map((cell, i) => (
          <CellToken key={i} cell={cell} />
        ))}
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-text-light text-2xl text-text-light">
          ?
        </div>
      </div>

      <p className="rounded-button bg-bg p-3 text-sm text-text">
        <span className="font-medium">Rules: </span>
        {puzzle.explanation}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {puzzle.options.map((option) => (
          <div
            key={option.id}
            className={`flex flex-col items-center gap-2 rounded-button border-2 p-3 text-center ${
              option.isCorrect ? "border-success bg-success/10" : "border-error/60 bg-error/5"
            }`}
          >
            <CellToken cell={option.cell} />
            <p className={`text-xs ${option.isCorrect ? "text-success" : "text-error"}`}>
              {option.isCorrect ? "✓ Correct - " : "✗ Distractor - "}
              {option.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PatternDevAuditPage() {
  const [tier, setTier] = useState<Tier>(1);
  const [seedCounter, setSeedCounter] = useState(0);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const regenerate = (nextTier: Tier = tier) => {
    setTier(nextTier);
    setSeedCounter((n) => n + 1);
    setError(null);
    try {
      setPuzzles(generateBatch(nextTier, BATCH_SIZE));
    } catch (e) {
      setPuzzles([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // Puzzle generation is random, so it must only run client-side - running it
  // during the initial render would make the server and client HTML diverge.
  // One-time client-only init (not state sync), so the setState-in-effect
  // rule doesn't apply, and it intentionally runs once regardless of later
  // tier changes (those go through `regenerate` instead).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    regenerate(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <BackButton />

      <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <div>
          <h1 className="text-2xl font-semibold text-text">Pattern Garden - Dev Audit</h1>
          <p className="text-sm text-text-light">
            Throwaway page for eyeballing puzzle quality. Not the real game UI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => regenerate(t)}
                className={`rounded-button px-4 py-2 text-sm font-medium transition-colors ${
                  t === tier ? "bg-primary text-white" : "bg-bg text-text-light hover:text-text"
                }`}
              >
                Tier {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => regenerate()}
            className="rounded-button bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Regenerate batch
          </button>
          <span className="text-xs text-text-light">
            batch #{seedCounter} · {puzzles.length} puzzles
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-card bg-error/10 p-4 text-sm text-error">
          Generation failed: {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {puzzles.map((puzzle, i) => (
          <PuzzleCard key={puzzle.id} puzzle={puzzle} index={i} />
        ))}
      </div>
    </div>
  );
}
