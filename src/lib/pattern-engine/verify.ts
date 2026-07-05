import { PROPERTY_KEYS } from "./types";
import type { Cell, Puzzle } from "./types";
import { cellAt } from "./rules";

export interface VerifyResult {
  ok: boolean;
  reasons: string[];
}

function cellKey(cell: Cell): string {
  return `${cell.species}|${cell.colour}|${cell.count}|${cell.growthStage}`;
}

/**
 * Structural solvability check, run on every generated puzzle. Puzzles that
 * fail any of these are discarded and regenerated (see generatePuzzle).
 */
export function verifyPuzzle(puzzle: Puzzle): VerifyResult {
  const reasons: string[] = [];

  const correctOptions = puzzle.options.filter((o) => o.isCorrect);
  if (correctOptions.length !== 1) {
    reasons.push(`expected exactly one correct option, found ${correctOptions.length}`);
  }

  const seen = new Set<string>();
  for (const option of puzzle.options) {
    const key = cellKey(option.cell);
    if (seen.has(key)) reasons.push(`duplicate option cell: ${key}`);
    seen.add(key);
  }

  const expectedCorrect = cellAt(puzzle.ruleset, puzzle.visible.length);
  const correct = correctOptions[0];
  if (correct && cellKey(correct.cell) !== cellKey(expectedCorrect)) {
    reasons.push("option marked correct does not match the ruleset's predicted next cell");
  }

  const maxPeriod = Math.max(...puzzle.governedProperties.map((key) => puzzle.ruleset[key].sequence.length));
  if (puzzle.visible.length < maxPeriod + 1) {
    reasons.push("visible row is too short to prove the cycle has wrapped");
  }
  if (puzzle.visible.length + 1 > 6) {
    reasons.push("puzzle exceeds the 6-slot mobile cell budget (visible cells + the '?' slot)");
  }

  for (const key of puzzle.governedProperties) {
    const values = puzzle.visible.map((c) => c[key]);
    if (new Set(values).size < 2) {
      reasons.push(`${key} is governed but never changes across the visible row`);
    }
    // Every rule's sequence must be internally distinct: a period-p rule with
    // a repeated value inside its own period would make a shorter period fit
    // the same visible data too, i.e. a genuinely ambiguous rule.
    const rule = puzzle.ruleset[key];
    const sequence: unknown[] = rule.sequence;
    if (new Set(sequence).size !== sequence.length) {
      reasons.push(`${key}'s rule has a repeated value within one period, which aliases to a shorter period`);
    }
  }

  for (const option of puzzle.options) {
    if (option.isCorrect) continue;
    const diffKeys = PROPERTY_KEYS.filter((key) => option.cell[key] !== expectedCorrect[key]);
    if (diffKeys.length < 1 || diffKeys.length > 2) {
      reasons.push(
        `distractor ${option.id} differs from correct on ${diffKeys.length} properties, expected 1-2`,
      );
    }
    for (const key of diffKeys) {
      if (!puzzle.governedProperties.includes(key)) {
        reasons.push(`distractor ${option.id} differs on a constant property (${key})`);
      }
    }
  }

  return { ok: reasons.length === 0, reasons };
}
