import {
  PROPERTY_KEYS,
  type Cell,
  type DistractorErrorKind,
  type Puzzle,
  type PuzzleOption,
  type PropertyKey,
  type RuleKind,
  type Ruleset,
  type Tier,
} from "./types";
import { cellAt, naturalKindFor, randomConstantRule, ruleWithPeriod, valueAt } from "./rules";
import { pickOne, randInt, sampleDistinct, shuffle, defaultRng, type RNG } from "./rng";
import { describeDistractor, describeRuleset } from "./explain";
import { verifyPuzzle } from "./verify";

interface GovernedSpec {
  property: PropertyKey;
  kind: RuleKind;
  period: number;
}

const CYCLE_PERIODS_FULL = [2, 3, 4] as const;
const CYCLE_PERIODS_SAFE = [2, 3] as const;
const PROGRESSION_PERIODS = [2, 3] as const;

function periodsFor(kind: "cycle" | "progression", allowFour: boolean): readonly number[] {
  if (kind === "progression") return PROGRESSION_PERIODS;
  return allowFour ? CYCLE_PERIODS_FULL : CYCLE_PERIODS_SAFE;
}

/** Tier 1: exactly one governed property, one real rule, all else constant. */
function planTier1(rng: RNG): GovernedSpec[] {
  const property = pickOne(rng, PROPERTY_KEYS);
  const kind = naturalKindFor(property);
  const period = pickOne(rng, periodsFor(kind, false));
  return [{ property, kind, period }];
}

/** Tier 2: two governed properties, each its own rule, the SAME period. */
function planTier2(rng: RNG): GovernedSpec[] {
  const properties = sampleDistinct(rng, PROPERTY_KEYS, 2);
  const kinds = properties.map(naturalKindFor);
  const bothCycle = kinds.every((k) => k === "cycle");
  const commonPeriods = bothCycle ? CYCLE_PERIODS_FULL : PROGRESSION_PERIODS;
  const period = pickOne(rng, commonPeriods);
  return properties.map((property, i) => ({ property, kind: kinds[i], period }));
}

/** Tier 3: two governed properties, each its own rule, DIFFERENT periods. */
function planTier3(rng: RNG): GovernedSpec[] {
  const properties = sampleDistinct(rng, PROPERTY_KEYS, 2);
  const kinds = properties.map(naturalKindFor);
  const options = kinds.map((k) => periodsFor(k, true));

  let periodA = pickOne(rng, options[0]);
  let periodB = pickOne(rng, options[1]);
  for (let attempt = 0; attempt < 20 && periodA === periodB; attempt++) {
    periodA = pickOne(rng, options[0]);
    periodB = pickOne(rng, options[1]);
  }
  if (periodA === periodB) {
    // Deterministic fallback: options always has >=2 distinct values available.
    periodB = options[1].find((p) => p !== periodA) ?? periodA;
  }

  return [
    { property: properties[0], kind: kinds[0], period: periodA },
    { property: properties[1], kind: kinds[1], period: periodB },
  ];
}

/**
 * Tier 4: three governed properties, mixed rule kinds (one cycle, one
 * progression, one alternation), coprime periods. Alternation is fixed at
 * period 2, so the cycle period is capped at {2,3}: a period-4 cycle would
 * share a factor with the alternation's 2 and defeat the "coprime" premise.
 */
function planTier4(rng: RNG): GovernedSpec[] {
  const cycleFamily: PropertyKey = pickOne(rng, ["species", "colour"] as const);
  const progressionFamily: PropertyKey = pickOne(rng, ["count", "growthStage"] as const);
  const otherCycleFamily: PropertyKey = cycleFamily === "species" ? "colour" : "species";
  const otherProgressionFamily: PropertyKey = progressionFamily === "count" ? "growthStage" : "count";
  const alternationProperty = pickOne(rng, [otherCycleFamily, otherProgressionFamily]);

  const cyclePeriod = pickOne(rng, CYCLE_PERIODS_SAFE);
  let progressionPeriod = pickOne(rng, PROGRESSION_PERIODS);
  // Guarantee real period diversity beyond the alternation's fixed 2.
  if (cyclePeriod === 2 && progressionPeriod === 2) progressionPeriod = 3;

  return [
    { property: cycleFamily, kind: "cycle", period: cyclePeriod },
    { property: progressionFamily, kind: "progression", period: progressionPeriod },
    { property: alternationProperty, kind: "alternation", period: 2 },
  ];
}

/** Tier 5 (ceiling): 3-4 governed properties, different periods, at least one alternation. */
function planTier5(rng: RNG): GovernedSpec[] {
  const governAll = rng() < 0.7;
  if (!governAll) return planTier4(rng);

  const alternationProperty = pickOne(rng, PROPERTY_KEYS);
  const rest = PROPERTY_KEYS.filter((p) => p !== alternationProperty);

  const specs: GovernedSpec[] = rest.map((property) => {
    const kind = naturalKindFor(property);
    const period = pickOne(rng, periodsFor(kind, false));
    return { property, kind, period };
  });
  specs.push({ property: alternationProperty, kind: "alternation", period: 2 });

  // Alternation locks in period 2; force at least one other clock to period 3
  // so the row genuinely carries more than one period, not just a repaint of 2.
  if (!specs.some((s) => s.kind !== "alternation" && s.period === 3)) {
    specs[0].period = 3;
  }

  return specs;
}

function planGoverned(tier: Tier, rng: RNG): GovernedSpec[] {
  switch (tier) {
    case 1:
      return planTier1(rng);
    case 2:
      return planTier2(rng);
    case 3:
      return planTier3(rng);
    case 4:
      return planTier4(rng);
    case 5:
      return planTier5(rng);
  }
}

function buildRuleset(rng: RNG, tier: Tier): { ruleset: Ruleset; governed: PropertyKey[] } {
  const specs = planGoverned(tier, rng);
  const byProperty = new Map(specs.map((s) => [s.property, s]));

  const ruleFor = (property: PropertyKey) => {
    const spec = byProperty.get(property);
    if (!spec) return randomConstantRule(rng, property);
    return ruleWithPeriod(rng, property, spec.kind as "cycle" | "progression" | "alternation", spec.period);
  };

  const ruleset: Ruleset = {
    species: ruleFor("species") as Ruleset["species"],
    colour: ruleFor("colour") as Ruleset["colour"],
    count: ruleFor("count") as Ruleset["count"],
    growthStage: ruleFor("growthStage") as Ruleset["growthStage"],
  };

  return { ruleset, governed: specs.map((s) => s.property) };
}

function withOverride<P extends PropertyKey>(base: Cell, property: P, value: Cell[P]): Cell {
  return { ...base, [property]: value };
}

interface BuiltDistractor {
  property: PropertyKey;
  cell: Cell;
  errorKind: DistractorErrorKind;
  borrowedFrom?: PropertyKey;
}

function simpleDistractor(
  ruleset: Ruleset,
  property: PropertyKey,
  answerPosition: number,
  correct: Cell,
  errorKind: "didnt-advance" | "overshot",
): BuiltDistractor {
  const rule = ruleset[property];
  const wrongValue =
    errorKind === "didnt-advance" ? valueAt(rule, answerPosition - 1) : valueAt(rule, answerPosition + 1);
  return { property, cell: withOverride(correct, property, wrongValue), errorKind };
}

/** Advances `property` as if it shared `borrowFrom`'s period instead of its own: the "wrong clock" error. */
function wrongClockDistractor(
  ruleset: Ruleset,
  property: PropertyKey,
  borrowFrom: PropertyKey,
  answerPosition: number,
  correct: Cell,
): BuiltDistractor {
  const rule = ruleset[property];
  const borrowedPeriod = ruleset[borrowFrom].sequence.length;
  const idx = (((rule.startOffset + answerPosition) % borrowedPeriod) + borrowedPeriod) % borrowedPeriod;
  const wrongValue = rule.sequence[idx % rule.sequence.length];
  return {
    property,
    cell: withOverride(correct, property, wrongValue),
    errorKind: "wrong-clock",
    borrowedFrom: borrowFrom,
  };
}

function buildDistractors(
  rng: RNG,
  ruleset: Ruleset,
  governed: PropertyKey[],
  answerPosition: number,
  correct: Cell,
): PuzzleOption[] {
  const built: BuiltDistractor[] = [];

  if (governed.length === 1) {
    const property = governed[0];
    built.push(simpleDistractor(ruleset, property, answerPosition, correct, "didnt-advance"));
    built.push(simpleDistractor(ruleset, property, answerPosition, correct, "overshot"));
  } else {
    // "Wrong clock" only reads as a distinct error when the borrowed property
    // actually runs on a different period - borrowing an equal period would
    // silently reproduce the correct value (this is exactly why tier 2, which
    // forces equal periods, has no valid pairs and falls through below).
    const periodOf = (p: PropertyKey) => ruleset[p].sequence.length;
    const wrongClockPairs: [PropertyKey, PropertyKey][] = [];
    for (const a of governed) {
      for (const b of governed) {
        if (a !== b && periodOf(a) !== periodOf(b)) wrongClockPairs.push([a, b]);
      }
    }

    if (wrongClockPairs.length > 0) {
      const basicProperty = pickOne(rng, governed);
      const basicKind = pickOne(rng, ["didnt-advance", "overshot"] as const);
      built.push(simpleDistractor(ruleset, basicProperty, answerPosition, correct, basicKind));

      const [clockProperty, borrowFrom] = pickOne(rng, wrongClockPairs);
      built.push(wrongClockDistractor(ruleset, clockProperty, borrowFrom, answerPosition, correct));
    } else {
      // All governed properties share one period (tier 2): one simple
      // distractor per property keeps the two options distinct.
      const [propertyA, propertyB] = governed;
      built.push(simpleDistractor(ruleset, propertyA, answerPosition, correct, "didnt-advance"));
      built.push(simpleDistractor(ruleset, propertyB, answerPosition, correct, "overshot"));
    }
  }

  return built.map((d, i) => ({
    id: `distractor-${i}`,
    cell: d.cell,
    isCorrect: false,
    reason: describeDistractor(d, ruleset, answerPosition),
  }));
}

function buildPuzzle(rng: RNG, tier: Tier): Puzzle {
  const { ruleset, governed } = buildRuleset(rng, tier);

  const maxPeriod = Math.max(...governed.map((key) => ruleset[key].sequence.length));
  const visibleLength = maxPeriod + 1;
  const answerPosition = visibleLength;

  const visible = Array.from({ length: visibleLength }, (_, i) => cellAt(ruleset, i));
  const correctCell = cellAt(ruleset, answerPosition);

  const correctOption: PuzzleOption = {
    id: "correct",
    cell: correctCell,
    isCorrect: true,
    reason: "Continues every rule in the row.",
  };
  const distractors = buildDistractors(rng, ruleset, governed, answerPosition, correctCell);

  const options = shuffle(rng, [correctOption, ...distractors]);

  return {
    id: `tier${tier}-${Date.now()}-${randInt(rng, 1_000_000)}`,
    tier,
    visible,
    options,
    ruleset,
    governedProperties: governed,
    explanation: describeRuleset(ruleset, governed),
  };
}

export function generatePuzzle(tier: Tier, rng: RNG = defaultRng(), maxAttempts = 200): Puzzle {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const puzzle = buildPuzzle(rng, tier);
    if (verifyPuzzle(puzzle).ok) return puzzle;
  }
  throw new Error(`Failed to generate a valid tier ${tier} puzzle after ${maxAttempts} attempts`);
}

export function generateBatch(tier: Tier, count: number, rng: RNG = defaultRng()): Puzzle[] {
  return Array.from({ length: count }, () => generatePuzzle(tier, rng));
}
