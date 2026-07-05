import { COLOURS, SPECIES } from "@/lib/pattern-engine";
import type { Cell, Colour, Species, Tier } from "@/lib/pattern-engine";

export const PATTERN_GARDEN_KEY = "clerkPatternGarden";

export type Difficulty = "tier1" | "tier2" | "tier3" | "tier4" | "tier5";

const DIFFICULTIES: Difficulty[] = ["tier1", "tier2", "tier3", "tier4", "tier5"];

// A correct streak this long bumps the garden to the next difficulty tier.
// Wrong answers reset the streak but never step difficulty back down - the
// garden should only ever feel like it's growing, not losing ground.
const STREAK_TO_ADVANCE = 5;

export interface GardenItem {
  species: Species;
  colour: Colour;
  timestamp: string;
}

export interface PatternGardenState {
  totalCorrect: number;
  totalPlayed: number;
  currentStreak: number;
  bestStreak: number;
  currentDifficulty: Difficulty;
  gardenItems: GardenItem[];
  lastPlayedAt: string | null;
}

export const DEFAULT_PATTERN_GARDEN_STATE: PatternGardenState = {
  totalCorrect: 0,
  totalPlayed: 0,
  currentStreak: 0,
  bestStreak: 0,
  currentDifficulty: "tier1",
  gardenItems: [],
  lastPlayedAt: null,
};

export function tierNumberFor(difficulty: Difficulty): Tier {
  return (DIFFICULTIES.indexOf(difficulty) + 1) as Tier;
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as string[]).includes(value);
}

function sanitizeGardenItem(raw: unknown): GardenItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!SPECIES.includes(r.species as Species)) return null;
  if (!COLOURS.includes(r.colour as Colour)) return null;
  if (typeof r.timestamp !== "string") return null;
  return { species: r.species as Species, colour: r.colour as Colour, timestamp: r.timestamp };
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

// Defensive against anything localStorage might hand back: a previous schema,
// a hand-edited value, or plain garbage. Every field falls back independently
// so one corrupt field doesn't wipe the rest of a real garden.
export function sanitizeGardenState(raw: unknown): PatternGardenState {
  if (!raw || typeof raw !== "object") return DEFAULT_PATTERN_GARDEN_STATE;
  const r = raw as Record<string, unknown>;

  const gardenItems = Array.isArray(r.gardenItems)
    ? r.gardenItems.map(sanitizeGardenItem).filter((item): item is GardenItem => item !== null)
    : [];

  return {
    totalCorrect: safeCount(r.totalCorrect),
    totalPlayed: safeCount(r.totalPlayed),
    currentStreak: safeCount(r.currentStreak),
    bestStreak: safeCount(r.bestStreak),
    currentDifficulty: isDifficulty(r.currentDifficulty) ? r.currentDifficulty : "tier1",
    gardenItems,
    lastPlayedAt: typeof r.lastPlayedAt === "string" ? r.lastPlayedAt : null,
  };
}

export function recordCorrectAnswer(
  state: PatternGardenState,
  cell: Cell,
): PatternGardenState {
  const currentStreak = state.currentStreak + 1;
  const difficultyIndex = DIFFICULTIES.indexOf(state.currentDifficulty);
  const shouldAdvance = currentStreak % STREAK_TO_ADVANCE === 0 && difficultyIndex < DIFFICULTIES.length - 1;

  return {
    ...state,
    totalCorrect: state.totalCorrect + 1,
    totalPlayed: state.totalPlayed + 1,
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    currentDifficulty: shouldAdvance ? DIFFICULTIES[difficultyIndex + 1] : state.currentDifficulty,
    gardenItems: [
      ...state.gardenItems,
      { species: cell.species, colour: cell.colour, timestamp: new Date().toISOString() },
    ],
    lastPlayedAt: new Date().toISOString(),
  };
}

export function recordWrongAnswer(state: PatternGardenState): PatternGardenState {
  return {
    ...state,
    totalPlayed: state.totalPlayed + 1,
    currentStreak: 0,
    lastPlayedAt: new Date().toISOString(),
  };
}
