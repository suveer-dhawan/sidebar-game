import type { Colour, Count, GrowthStage, PropertyKey, Species } from "./types";

export const SPECIES: Species[] = [
  "daisy",
  "tulip",
  "poppy",
  "bellflower",
  "rose",
  "clover",
];

export const COLOURS: Colour[] = [
  "peach",
  "sage",
  "lavender",
  "coral",
  "sky",
  "cream",
];

export const COUNTS: Count[] = [1, 2, 3];

export const GROWTH_STAGES: GrowthStage[] = ["bud", "half-open", "full-bloom"];

export const DOMAINS: { [P in PropertyKey]: import("./types").Cell[P][] } = {
  species: SPECIES,
  colour: COLOURS,
  count: COUNTS,
  growthStage: GROWTH_STAGES,
};

export const COLOUR_LABEL: Record<Colour, string> = {
  peach: "peach",
  sage: "sage",
  lavender: "lavender",
  coral: "soft coral",
  sky: "sky blue",
  cream: "cream",
};

export const COLOUR_HEX: Record<Colour, string> = {
  peach: "#f4c7a1",
  sage: "#a8d5ba",
  lavender: "#c3a6d8",
  coral: "#e8a0a0",
  sky: "#a8c8e8",
  cream: "#f5efe0",
};

export const SPECIES_LABEL: Record<Species, string> = {
  daisy: "daisy",
  tulip: "tulip",
  poppy: "poppy",
  bellflower: "bellflower",
  rose: "rose",
  clover: "clover",
};

export const SPECIES_EMOJI: Record<Species, string> = {
  daisy: "🌼",
  tulip: "🌷",
  poppy: "🌺",
  bellflower: "🪻",
  rose: "🌹",
  clover: "🍀",
};

export const GROWTH_LABEL: Record<GrowthStage, string> = {
  bud: "bud",
  "half-open": "half-open",
  "full-bloom": "full bloom",
};

export const PROPERTY_LABEL: Record<PropertyKey, string> = {
  species: "species",
  colour: "colour",
  count: "count",
  growthStage: "growth stage",
};
