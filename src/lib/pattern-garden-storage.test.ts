import { describe, expect, it } from "vitest";
import {
  DEFAULT_PATTERN_GARDEN_STATE,
  recordCorrectAnswer,
  recordWrongAnswer,
  sanitizeGardenState,
  tierNumberFor,
  type PatternGardenState,
} from "./pattern-garden-storage";
import type { Cell } from "@/lib/pattern-engine";

const CELL: Cell = { species: "daisy", colour: "peach", count: 1, growthStage: "bud" };

function playCorrect(state: PatternGardenState, times: number): PatternGardenState {
  let next = state;
  for (let i = 0; i < times; i++) next = recordCorrectAnswer(next, CELL);
  return next;
}

function playWrong(state: PatternGardenState, times: number): PatternGardenState {
  let next = state;
  for (let i = 0; i < times; i++) next = recordWrongAnswer(next);
  return next;
}

describe("pattern garden difficulty ladder", () => {
  it("starts new players at tier 1", () => {
    expect(tierNumberFor(DEFAULT_PATTERN_GARDEN_STATE.currentDifficulty)).toBe(1);
  });

  it("climbs one tier after a streak of 5-6 correct, never further in one go", () => {
    // The threshold is randomized 5-6, so any leftover correct beyond it
    // carries into the new tier's streak rather than resetting to exactly 0.
    const state = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 6);
    expect(tierNumberFor(state.currentDifficulty)).toBe(2);
    expect(state.currentStreak).toBeLessThanOrEqual(1);
  });

  it("does not climb before the streak target is reached", () => {
    const state = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 4);
    expect(tierNumberFor(state.currentDifficulty)).toBe(1);
    expect(state.currentStreak).toBe(4);
  });

  it("never climbs past the tier 5 ceiling", () => {
    const state = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 6 * 10);
    expect(tierNumberFor(state.currentDifficulty)).toBe(5);
  });

  it("drops one tier after two wrong answers in a row", () => {
    const climbed = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 6);
    expect(tierNumberFor(climbed.currentDifficulty)).toBe(2);

    const dropped = playWrong(climbed, 2);
    expect(tierNumberFor(dropped.currentDifficulty)).toBe(1);
    expect(dropped.wrongStreak).toBe(0);
  });

  it("does not drop after a single wrong answer", () => {
    const climbed = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 6);
    const oneWrong = recordWrongAnswer(climbed);
    expect(tierNumberFor(oneWrong.currentDifficulty)).toBe(2);
    expect(oneWrong.wrongStreak).toBe(1);
  });

  it("a correct answer resets the wrong streak", () => {
    const climbed = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 6);
    const state = recordCorrectAnswer(recordWrongAnswer(climbed), CELL);
    expect(state.wrongStreak).toBe(0);
    expect(tierNumberFor(state.currentDifficulty)).toBe(2);
  });

  it("never drops below the tier 1 floor", () => {
    const state = playWrong(DEFAULT_PATTERN_GARDEN_STATE, 10);
    expect(tierNumberFor(state.currentDifficulty)).toBe(1);
  });

  it("persists currentDifficulty across a sanitize round-trip", () => {
    const climbed = playCorrect(DEFAULT_PATTERN_GARDEN_STATE, 6);
    const restored = sanitizeGardenState(JSON.parse(JSON.stringify(climbed)));
    expect(restored.currentDifficulty).toBe(climbed.currentDifficulty);
    expect(restored.streakTarget).toBe(climbed.streakTarget);
  });

  it("falls back to a safe streakTarget when sanitizing garbage", () => {
    const restored = sanitizeGardenState({ streakTarget: 999 });
    expect(restored.streakTarget).toBe(5);
  });
});
