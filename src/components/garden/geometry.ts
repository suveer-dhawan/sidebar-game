/**
 * Petal/leaf silhouettes are built from two reusable primitives so every
 * species shares the same hand-tuned curve quality instead of six unrelated
 * path strings. Both are defined pointing straight up from the origin.
 */

// A pointed lens/leaf outline: sharp tip at (0,0) and (0,-length).
export function lensPetal(halfWidth: number, length: number): string {
  const w = halfWidth;
  const l = length;
  return `M0,0 C${-w},${-l * 0.28} ${-w * 0.82},${-l * 0.78} 0,${-l} C${w * 0.82},${-l * 0.78} ${w},${-l * 0.28} 0,0 Z`;
}

// A wide-based petal with a rounded dome tip - used for cup/flare blooms.
export function roundTipPetal(halfWidth: number, length: number): string {
  const w = halfWidth;
  const l = length;
  const r = w * 0.88;
  const tipY = -l;
  return [
    `M${-w},0`,
    `C${-w * 1.1},${-l * 0.5} ${-r},${tipY + r * 1.05} ${-r},${tipY}`,
    `A${r},${r} 0 0 1 ${r},${tipY}`,
    `C${r},${tipY + r * 1.05} ${w * 1.1},${-l * 0.5} ${w},0`,
    `C${w * 0.55},${l * 0.1} ${-w * 0.55},${l * 0.1} ${-w},0`,
    "Z",
  ].join(" ");
}

export interface BloomAnchor {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

// Deterministic, hand-placed cluster layouts (not a grid, not random) so a
// plot with 2-3 blooms reads as a small planted cluster.
export const BLOOM_ANCHORS: Record<1 | 2 | 3, BloomAnchor[]> = {
  1: [{ x: 50, y: 76, rotate: -3, scale: 1.05 }],
  2: [
    { x: 37, y: 78, rotate: -9, scale: 0.9 },
    { x: 63, y: 73, rotate: 7, scale: 1.0 },
  ],
  3: [
    { x: 28, y: 80, rotate: -12, scale: 0.82 },
    { x: 52, y: 71, rotate: 2, scale: 1.0 },
    { x: 74, y: 79, rotate: 11, scale: 0.86 },
  ],
};

export const STEM_LENGTH = 30;

export const GROWTH_METRICS: Record<
  "bud" | "half-open" | "full-bloom",
  { stemMul: number; headScale: number; leafScale: number }
> = {
  bud: { stemMul: 0.82, headScale: 0.85, leafScale: 0.65 },
  "half-open": { stemMul: 0.92, headScale: 1.0, leafScale: 0.85 },
  "full-bloom": { stemMul: 1, headScale: 1.15, leafScale: 1 },
};
