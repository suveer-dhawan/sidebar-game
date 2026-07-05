import { COLOUR_HEX } from "@/lib/pattern-engine";
import type { Colour } from "@/lib/pattern-engine";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = target;
  return rgbToHex([r + (tr - r) * amount, g + (tg - g) * amount, b + (tb - b) * amount]);
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, [255, 255, 255], amount);
}

// Mixes toward a warm near-black rather than pure black, so shadows stay
// in the cozy palette family instead of turning grey/cold.
export function darken(hex: string, amount: number): string {
  return mix(hex, [36, 24, 20], amount);
}

export interface BloomPalette {
  light: string;
  base: string;
  dark: string;
  deep: string;
}

export function getBloomPalette(colour: Colour): BloomPalette {
  const base = COLOUR_HEX[colour];
  return {
    light: lighten(base, 0.5),
    base,
    dark: darken(base, 0.16),
    deep: darken(base, 0.34),
  };
}

export const LEAF_PALETTE: BloomPalette = {
  light: lighten(COLOUR_HEX.sage, 0.45),
  base: COLOUR_HEX.sage,
  dark: darken(COLOUR_HEX.sage, 0.28),
  deep: darken(COLOUR_HEX.sage, 0.45),
};

export const CORE_PALETTE: BloomPalette = {
  light: "#fdf6ea",
  base: COLOUR_HEX.cream,
  dark: darken(COLOUR_HEX.peach, 0.1),
  deep: darken(COLOUR_HEX.peach, 0.3),
};

export const SOIL_PALETTE: BloomPalette = {
  light: "#e8caa4",
  base: "#cda57d",
  dark: "#a9805b",
  deep: "#83603f",
};
