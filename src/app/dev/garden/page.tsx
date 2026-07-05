"use client";

import { useMemo, useState } from "react";
import { BackButton } from "@/components/layout/BackButton";
import { GardenView } from "@/components/garden/GardenView";
import { COLOURS, SPECIES } from "@/lib/pattern-engine";
import type { GardenItem } from "@/lib/pattern-garden-storage";

function makeItems(count: number): GardenItem[] {
  return Array.from({ length: count }, (_, i) => ({
    species: SPECIES[i % SPECIES.length],
    colour: COLOURS[i % COLOURS.length],
    timestamp: new Date(2026, 0, 1 + i).toISOString(),
  }));
}

export default function GardenDevPage() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const items = useMemo(() => makeItems(count), [count]);

  const presets = [0, 3, 8, 12, 15, 24, 30];

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <BackButton />
      <h1 className="text-2xl font-semibold text-text">Garden view dev harness</h1>
      <p className="max-w-md text-sm text-text-light">
        Renders <code className="text-text">GardenView</code> with a synthetic item count - not the
        game screen.
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            className="rounded-button bg-surface px-3 py-1.5 text-sm text-text"
            onClick={() => {
              setCount(p);
              setOpen(true);
            }}
          >
            {p} blooms
          </button>
        ))}
      </div>
      {open && (
        <GardenView items={items} bestStreak={7} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
