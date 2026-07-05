"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GardenBed, BED_CAPACITY } from "@/components/garden/GardenBed";
import { SOIL_PALETTE, GROUND_PALETTE, darken, lighten } from "@/components/garden/colour";
import type { GardenItem } from "@/lib/pattern-garden-storage";

interface GardenViewProps {
  items: GardenItem[];
  bestStreak: number;
  onClose: () => void;
}

// Warm, hand-picked bed names - cycles with a roman-numeral suffix once
// exhausted, so the garden keeps naming new beds indefinitely as it grows.
const BED_NAMES = [
  "Spring Bed",
  "Wildflower Patch",
  "Herb Corner",
  "Rose Row",
  "Meadow Plot",
  "Moon Garden",
  "Sunny Border",
  "Cottage Corner",
  "Butterfly Patch",
  "Fern Hollow",
];
const ROMAN = ["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function bedNameFor(index: number): string {
  const cycle = Math.floor(index / BED_NAMES.length);
  const base = BED_NAMES[index % BED_NAMES.length];
  return cycle === 0 ? base : `${base} ${ROMAN[cycle] ?? cycle + 1}`;
}

function LockedBed() {
  return (
    <div className="flex h-full w-full flex-col gap-2 px-1">
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[26px] p-[9px]"
        style={{ background: `linear-gradient(155deg, ${lighten(SOIL_PALETTE.base, 0.2)} 0%, ${SOIL_PALETTE.base} 100%)`, opacity: 0.55 }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[19px]"
          style={{ background: lighten(GROUND_PALETTE.base, 0.35) }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold"
            style={{
              color: darken(SOIL_PALETTE.dark, 0.1),
              border: `2px dashed ${darken(SOIL_PALETTE.dark, 0.05)}`,
              opacity: 0.7,
            }}
          >
            ?
          </span>
          <p className="text-sm font-medium" style={{ color: darken(SOIL_PALETTE.dark, 0.1), opacity: 0.75 }}>
            Keep growing
          </p>
        </div>
      </div>
    </div>
  );
}

export function GardenView({ items, bestStreak, onClose }: GardenViewProps) {
  const sceneGradient = "linear-gradient(180deg, #FFFCF7 0%, #FFF6E9 22%, #FDE9D0 42%, #FBDFC0 62%, #F7D3AC 100%)";
  const pill = { bg: lighten(SOIL_PALETTE.base, 0.72), text: darken(SOIL_PALETTE.dark, 0.15) };

  // One more bed is always unlocked than the number of fully completed beds,
  // so finishing a bed immediately opens the next (empty) one to plant into.
  const unlockedBedCount = Math.floor(items.length / BED_CAPACITY) + 1;
  const beds = useMemo(
    () =>
      Array.from({ length: unlockedBedCount }, (_, i) =>
        items.slice(i * BED_CAPACITY, (i + 1) * BED_CAPACITY),
      ),
    [items, unlockedBedCount],
  );
  const slideCount = unlockedBedCount + 1; // + one locked teaser after the active bed

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(unlockedBedCount - 1);

  // Open straight onto the bed currently being planted, not bed one.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = unlockedBedCount - 1;
    el.scrollTo({ left: index * el.clientWidth, behavior: "auto" });
    setActiveIndex(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  const currentName = activeIndex < unlockedBedCount ? bedNameFor(activeIndex) : "Keep growing";

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

      <div className="relative z-10 mt-1 flex shrink-0 items-center justify-between px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-light">
          {currentName}
        </span>
        <div className="flex gap-1.5">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: pill.bg, color: pill.text }}
          >
            {items.length} {items.length === 1 ? "bloom" : "blooms"}
          </span>
          {bestStreak > 0 && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: pill.bg, color: pill.text }}
            >
              best streak {bestStreak}
            </span>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative z-10 mt-2 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {beds.map((bedItems, i) => (
          <div key={i} className="w-full shrink-0 snap-center px-3 pb-2" style={{ scrollSnapAlign: "center" }}>
            <GardenBed items={bedItems} bedIndex={i} />
          </div>
        ))}
        <div key="locked" className="w-full shrink-0 snap-center px-3 pb-2" style={{ scrollSnapAlign: "center" }}>
          <LockedBed />
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center justify-center gap-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        {Array.from({ length: slideCount }).map((_, i) => {
          const locked = i >= unlockedBedCount;
          const active = i === activeIndex;
          return (
            <button
              key={i}
              type="button"
              aria-label={locked ? `Locked bed ${i + 1}` : `Go to ${bedNameFor(i)}`}
              onClick={() => goTo(i)}
              className="rounded-full transition-all"
              style={{
                width: active ? 16 : 6,
                height: 6,
                background: locked ? "transparent" : pill.text,
                border: locked ? `1.5px dashed ${pill.text}` : "none",
                opacity: active ? 0.9 : locked ? 0.4 : 0.35,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
