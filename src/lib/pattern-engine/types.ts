export type Species =
  | "daisy"
  | "tulip"
  | "poppy"
  | "bellflower"
  | "rose"
  | "clover";

export type Colour = "peach" | "sage" | "lavender" | "coral" | "sky" | "cream";

export type Count = 1 | 2 | 3;

export type GrowthStage = "bud" | "half-open" | "full-bloom";

export interface Cell {
  species: Species;
  colour: Colour;
  count: Count;
  growthStage: GrowthStage;
}

export type PropertyKey = keyof Cell;

export const PROPERTY_KEYS: PropertyKey[] = [
  "species",
  "colour",
  "count",
  "growthStage",
];

export type RuleKind = "constant" | "cycle" | "progression" | "alternation";

/**
 * A rule is a repeating sequence of values for one property, viewed starting
 * at `startOffset`. The value at row position i is `sequence[(startOffset +
 * i) mod sequence.length]`. This one shape covers all four rule kinds:
 * constant is period 1, alternation is period 2, cycle/progression are
 * period 2-4. `kind` only changes how the rule reads in English and which
 * property/period combinations the generator is willing to produce.
 */
export interface PropertyRule<P extends PropertyKey = PropertyKey> {
  property: P;
  kind: RuleKind;
  sequence: Cell[P][];
  startOffset: number;
}

export type Ruleset = { [P in PropertyKey]: PropertyRule<P> };

/**
 * The five-rung SHL-style difficulty ladder. See generator.ts for the exact
 * governed-property-count / rule-kind / period contract each tier promises.
 */
export type Tier = 1 | 2 | 3 | 4 | 5;

export type DistractorErrorKind = "didnt-advance" | "overshot" | "wrong-clock";

export interface PuzzleOption {
  id: string;
  cell: Cell;
  isCorrect: boolean;
  reason: string;
}

export interface Puzzle {
  id: string;
  tier: Tier;
  visible: Cell[];
  options: PuzzleOption[];
  ruleset: Ruleset;
  governedProperties: PropertyKey[];
  explanation: string;
}
