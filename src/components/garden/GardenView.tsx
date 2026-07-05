"use client";

import { Plant } from "@/components/garden/Plant";
import { Cat, type CatMood } from "@/components/garden/Cat";
import { SOIL_PALETTE, darken, lighten } from "@/components/garden/colour";
import type { GardenItem } from "@/lib/pattern-garden-storage";

// The more the garden fills in, the more settled she gets - curious in a
// young garden, properly curled up and content once it's really grown.
function catMoodFor(itemCount: number): CatMood {
  if (itemCount === 0) return "napping";
  if (itemCount < 5) return "alert";
  return "curled";
}

interface GardenViewProps {
  items: GardenItem[];
  bestStreak: number;
  onClose: () => void;
}

// Small deterministic scatter so the meadow doesn't read as a rigid grid -
// keyed off index, not randomness, so it's stable across re-renders.
function offsetFor(index: number): { y: number; rotate: number } {
  const y = [0, 10, 4, 14, 2, 8][index % 6];
  const rotate = [-4, 3, -2, 5, -3, 2][index % 6];
  return { y, rotate };
}

function formatPlantedOn(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function GardenView({ items, bestStreak, onClose }: GardenViewProps) {
  const sceneGradient = "linear-gradient(180deg, #FFFCF7 0%, #FFF6E9 22%, #FDE9D0 42%, #FBDFC0 62%, #F7D3AC 100%)";
  const pill = { bg: lighten(SOIL_PALETTE.base, 0.72), text: darken(SOIL_PALETTE.dark, 0.15) };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ background: sceneGradient }}
      role="dialog"
      aria-modal="true"
      aria-label="Your garden"
    >
      <div
        className="bg-grain pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        aria-hidden="true"
      />

      <div
        className="relative z-10 flex shrink-0 items-center justify-between px-4"
        style={{ paddingTop: "max(0.9rem, env(safe-area-inset-top))" }}
      >
        <h2
          className="text-base font-semibold text-text"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 600 }}
        >
          Your Garden
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-text-light transition-colors hover:text-text"
          style={{ background: "rgba(255,255,255,0.55)" }}
        >
          Done
        </button>
      </div>

      {items.length > 0 && (
        <div className="relative z-10 mt-2 flex shrink-0 items-center justify-center gap-2 px-4">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: pill.bg, color: pill.text }}
          >
            {items.length} {items.length === 1 ? "bloom" : "blooms"} grown
          </span>
          {bestStreak > 0 && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: pill.bg, color: pill.text }}
            >
              best streak {bestStreak}
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Plant size={96} />
            <Cat mood="napping" size={40} />
            <p className="max-w-[220px] text-sm text-text-light">
              Nothing&apos;s grown yet. Plant your first seedling and it&apos;ll take root here.
            </p>
          </div>
        ) : (
          <div className="mx-auto my-auto flex max-w-md flex-wrap items-end justify-center gap-x-1 gap-y-4 py-4">
            {items.map((item, i) => {
              const { y, rotate } = offsetFor(i);
              const date = formatPlantedOn(item.timestamp);
              return (
                <div
                  key={`${item.timestamp}-${i}`}
                  className="flex flex-col items-center"
                  style={{ transform: `translateY(${y}px) rotate(${rotate}deg)` }}
                  title={date}
                >
                  <Plant species={item.species} colour={item.colour} size={56} />
                </div>
              );
            })}
            <div className="flex flex-col items-center" style={{ transform: "translateY(6px)" }}>
              <Cat mood={catMoodFor(items.length)} size={64} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
