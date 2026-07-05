import { describe, expect, it } from "vitest";
import { generatePuzzle, generateBatch } from "./generator";
import { verifyPuzzle } from "./verify";
import { mulberry32 } from "./rng";
import { DOMAINS } from "./domains";
import { PROPERTY_KEYS } from "./types";
import type { Tier } from "./types";

const TIERS: Tier[] = [1, 2, 3, 4, 5];
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 97 + 1);

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

describe("generatePuzzle", () => {
  for (const tier of TIERS) {
    it(`produces solvable tier ${tier} puzzles across many seeds`, () => {
      for (const seed of SEEDS) {
        const rng = mulberry32(seed);
        const puzzle = generatePuzzle(tier, rng);
        const result = verifyPuzzle(puzzle);
        expect(result.ok, result.reasons.join("; ")).toBe(true);
      }
    });
  }

  it("tier 1 governs exactly one property", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 30; i++) {
      expect(generatePuzzle(1, rng).governedProperties).toHaveLength(1);
    }
  });

  it("tiers 2-3 govern exactly two properties", () => {
    const rng = mulberry32(124);
    for (let i = 0; i < 30; i++) {
      expect(generatePuzzle(2, rng).governedProperties).toHaveLength(2);
      expect(generatePuzzle(3, rng).governedProperties).toHaveLength(2);
    }
  });

  it("tier 2 assigns the same period to both governed properties", () => {
    const rng = mulberry32(200);
    for (let i = 0; i < 30; i++) {
      const puzzle = generatePuzzle(2, rng);
      const periods = puzzle.governedProperties.map((k) => puzzle.ruleset[k].sequence.length);
      expect(periods[0]).toBe(periods[1]);
    }
  });

  it("tier 3 assigns different periods to its two governed properties", () => {
    const rng = mulberry32(201);
    for (let i = 0; i < 30; i++) {
      const puzzle = generatePuzzle(3, rng);
      const periods = puzzle.governedProperties.map((k) => puzzle.ruleset[k].sequence.length);
      expect(periods[0]).not.toBe(periods[1]);
    }
  });

  it("tier 4 governs exactly three properties with one cycle, one progression, one alternation", () => {
    const rng = mulberry32(202);
    for (let i = 0; i < 30; i++) {
      const puzzle = generatePuzzle(4, rng);
      expect(puzzle.governedProperties).toHaveLength(3);
      const kinds = puzzle.governedProperties.map((k) => puzzle.ruleset[k].kind).sort();
      expect(kinds).toEqual(["alternation", "cycle", "progression"]);
    }
  });

  it("tier 4 uses pairwise-coprime distinct periods among governed properties", () => {
    const rng = mulberry32(203);
    for (let i = 0; i < 30; i++) {
      const puzzle = generatePuzzle(4, rng);
      const periods = [...new Set(puzzle.governedProperties.map((k) => puzzle.ruleset[k].sequence.length))];
      for (let a = 0; a < periods.length; a++) {
        for (let b = a + 1; b < periods.length; b++) {
          expect(gcd(periods[a], periods[b])).toBe(1);
        }
      }
    }
  });

  it("tier 5 governs three or four properties and always includes an alternation", () => {
    const rng = mulberry32(204);
    for (let i = 0; i < 30; i++) {
      const puzzle = generatePuzzle(5, rng);
      expect([3, 4]).toContain(puzzle.governedProperties.length);
      const kinds = puzzle.governedProperties.map((k) => puzzle.ruleset[k].kind);
      expect(kinds).toContain("alternation");
    }
  });

  it("has exactly one correct option and two distinct distractors at every tier", () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 60; i++) {
      for (const tier of TIERS) {
        const puzzle = generatePuzzle(tier, rng);
        expect(puzzle.options).toHaveLength(3);
        expect(puzzle.options.filter((o) => o.isCorrect)).toHaveLength(1);

        const cellKeys = puzzle.options.map((o) => JSON.stringify(o.cell));
        expect(new Set(cellKeys).size).toBe(3);
      }
    }
  });

  it("every distractor changes only governed properties, never constants", () => {
    const rng = mulberry32(55);
    for (let i = 0; i < 60; i++) {
      for (const tier of TIERS) {
        const puzzle = generatePuzzle(tier, rng);
        const correct = puzzle.options.find((o) => o.isCorrect)!.cell;

        for (const option of puzzle.options.filter((o) => !o.isCorrect)) {
          const diffKeys = PROPERTY_KEYS.filter((key) => option.cell[key] !== correct[key]);
          expect(diffKeys.length).toBeGreaterThanOrEqual(1);
          expect(diffKeys.length).toBeLessThanOrEqual(2);
          for (const key of diffKeys) {
            expect(puzzle.governedProperties).toContain(key);
          }
        }
      }
    }
  });

  it("tiers with differing governed periods include a wrong-clock distractor", () => {
    // Tier 2 forces equal periods across its governed properties, so
    // "wrong clock" (borrowing another property's period) can't produce a
    // value distinct from correct there - only tiers 3+ can guarantee it.
    const rng = mulberry32(77);
    for (let i = 0; i < 30; i++) {
      for (const tier of [3, 4, 5] as Tier[]) {
        const puzzle = generatePuzzle(tier, rng);
        expect(puzzle.options.some((o) => o.reason.startsWith("Wrong clock"))).toBe(true);
      }
    }
  });

  it("shows enough cells to prove the longest cycle has wrapped, within the 6-slot budget", () => {
    const rng = mulberry32(321);
    for (let i = 0; i < 30; i++) {
      for (const tier of TIERS) {
        const puzzle = generatePuzzle(tier, rng);
        const maxPeriod = Math.max(
          ...puzzle.governedProperties.map((key) => puzzle.ruleset[key].sequence.length),
        );
        expect(puzzle.visible.length).toBe(maxPeriod + 1);
        expect(puzzle.visible.length + 1).toBeLessThanOrEqual(6);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generatePuzzle(3, mulberry32(2024));
    const b = generatePuzzle(3, mulberry32(2024));
    expect(a.visible).toEqual(b.visible);
    expect(a.options.map((o) => o.cell)).toEqual(b.options.map((o) => o.cell));
  });

  it("generateBatch returns the requested count, all solvable", () => {
    const rng = mulberry32(11);
    const batch = generateBatch(1, 25, rng);
    expect(batch).toHaveLength(25);
    for (const puzzle of batch) {
      expect(verifyPuzzle(puzzle).ok).toBe(true);
    }
  });
});

describe("verifyPuzzle", () => {
  it("flags a puzzle with two correct options", () => {
    const puzzle = generatePuzzle(1, mulberry32(3));
    const broken = {
      ...puzzle,
      options: puzzle.options.map((o) => ({ ...o, isCorrect: true })),
    };
    expect(verifyPuzzle(broken).ok).toBe(false);
  });

  it("flags a distractor that flips a constant property", () => {
    const puzzle = generatePuzzle(1, mulberry32(3));
    const constantKey = PROPERTY_KEYS.find((k) => !puzzle.governedProperties.includes(k))!;
    const currentValue = puzzle.visible[0][constantKey];
    const domain = DOMAINS[constantKey];
    const otherValue = domain.find((v) => v !== currentValue)!;

    const targetId = puzzle.options.find((o) => !o.isCorrect)!.id;
    const options = puzzle.options.map((o) =>
      o.id === targetId ? { ...o, cell: { ...o.cell, [constantKey]: otherValue } } : o,
    );

    expect(verifyPuzzle({ ...puzzle, options }).ok).toBe(false);
  });
});
