import { DOMAINS } from "./domains";
import type { Cell, PropertyKey, PropertyRule, Ruleset } from "./types";
import { pickOne, randInt, sampleDistinct, type RNG } from "./rng";

/** Value this rule produces at row position `position` (0-indexed, can exceed the visible row). */
export function valueAt<P extends PropertyKey>(
  rule: PropertyRule<P>,
  position: number,
): Cell[P] {
  const period = rule.sequence.length;
  const idx = (((rule.startOffset + position) % period) + period) % period;
  return rule.sequence[idx];
}

export function cellAt(ruleset: Ruleset, position: number): Cell {
  return {
    species: valueAt(ruleset.species, position),
    colour: valueAt(ruleset.colour, position),
    count: valueAt(ruleset.count, position),
    growthStage: valueAt(ruleset.growthStage, position),
  };
}

export function constantRule<P extends PropertyKey>(
  property: P,
  value: Cell[P],
): PropertyRule<P> {
  return { property, kind: "constant", sequence: [value], startOffset: 0 };
}

export function randomConstantRule<P extends PropertyKey>(rng: RNG, property: P): PropertyRule<P> {
  const domain = DOMAINS[property] as Cell[P][];
  return constantRule(property, pickOne(rng, domain));
}

const isCategorical = (property: PropertyKey) => property === "species" || property === "colour";

/** Cycle: a chosen subset of the domain, shuffled, repeating. Only valid for species/colour (6-value domains). */
export function cycleRule<P extends PropertyKey>(
  rng: RNG,
  property: P,
  period: number,
): PropertyRule<P> {
  if (!isCategorical(property)) {
    throw new Error(`cycleRule only supports categorical properties, got ${property}`);
  }
  const domain = DOMAINS[property] as Cell[P][];
  const sequence = sampleDistinct(rng, domain, period);
  return { property, kind: "cycle", sequence, startOffset: randInt(rng, period) };
}

/**
 * Progression: an ordered, cyclic slice of the domain (count / growthStage,
 * 3-value domains), stepping forward and wrapping. `period` may be shorter
 * than the full domain (e.g. growthStage bud->half-open->bud, period 2),
 * which lets tiers 4-5 pick periods that avoid colliding with other clocks.
 */
export function progressionRule<P extends PropertyKey>(
  rng: RNG,
  property: P,
  period: number,
): PropertyRule<P> {
  if (isCategorical(property)) {
    throw new Error(`progressionRule only supports ordered properties, got ${property}`);
  }
  const domain = DOMAINS[property] as Cell[P][];
  const start = randInt(rng, domain.length);
  const sequence = Array.from({ length: period }, (_, i) => domain[(start + i) % domain.length]);
  return { property, kind: "progression", sequence, startOffset: randInt(rng, period) };
}

/** Alternation: ABAB on two values from the domain. Period is always 2 by definition. */
export function alternationRule<P extends PropertyKey>(rng: RNG, property: P): PropertyRule<P> {
  const domain = DOMAINS[property] as Cell[P][];
  const sequence = sampleDistinct(rng, domain, 2);
  return { property, kind: "alternation", sequence, startOffset: randInt(rng, 2) };
}

/** The natural non-alternation rule kind for a property's family. */
export function naturalKindFor(property: PropertyKey): "cycle" | "progression" {
  return isCategorical(property) ? "cycle" : "progression";
}

export function ruleWithPeriod(
  rng: RNG,
  property: PropertyKey,
  kind: "cycle" | "progression" | "alternation",
  period: number,
): PropertyRule {
  if (kind === "alternation") return alternationRule(rng, property);
  if (kind === "cycle") return cycleRule(rng, property, period);
  return progressionRule(rng, property, period);
}
