import { COLOUR_LABEL, GROWTH_LABEL, PROPERTY_LABEL, SPECIES_LABEL } from "./domains";
import type { Cell, DistractorErrorKind, PropertyKey, PropertyRule, Ruleset } from "./types";
import { valueAt } from "./rules";

function labelFor<P extends PropertyKey>(property: P, value: Cell[P]): string {
  switch (property) {
    case "colour":
      return COLOUR_LABEL[value as Cell["colour"]];
    case "species":
      return SPECIES_LABEL[value as Cell["species"]];
    case "growthStage":
      return GROWTH_LABEL[value as Cell["growthStage"]];
    case "count":
      return String(value);
    default:
      return String(value);
  }
}

function describeRule<P extends PropertyKey>(rule: PropertyRule<P>): string {
  const label = PROPERTY_LABEL[rule.property];
  const values = rule.sequence.map((v) => labelFor(rule.property, v));
  const period = rule.sequence.length;

  switch (rule.kind) {
    case "constant":
      return `${label} stays ${values[0]} the whole row`;
    case "progression":
      return `${label} steps forward ${values.join(" -> ")} -> ${values[0]}... (period ${period})`;
    case "cycle":
      return `${label} cycles ${values.join(" -> ")} -> ${values[0]}... (period ${period})`;
    case "alternation":
      return `${label} alternates ${values[0]} / ${values[1]} (period 2)`;
  }
}

export function describeRuleset(ruleset: Ruleset, governed: PropertyKey[]): string {
  const governedText = governed.map((key) => describeRule(ruleset[key])).join("; ");
  const constantKeys = (Object.keys(ruleset) as PropertyKey[]).filter((k) => !governed.includes(k));
  const constantText =
    constantKeys.length > 0 ? `; all else constant (${constantKeys.map((k) => PROPERTY_LABEL[k]).join(", ")})` : "";
  return `${governedText}${constantText}.`;
}

export interface DistractorDescriptionInput {
  property: PropertyKey;
  errorKind: DistractorErrorKind;
  borrowedFrom?: PropertyKey;
}

export function describeDistractor(
  distractor: DistractorDescriptionInput,
  ruleset: Ruleset,
  answerPosition: number,
): string {
  const { property, errorKind, borrowedFrom } = distractor;
  const rule = ruleset[property];
  const label = PROPERTY_LABEL[property];
  const correct = labelFor(property, valueAt(rule, answerPosition));

  if (errorKind === "didnt-advance") {
    const shown = labelFor(property, valueAt(rule, answerPosition - 1));
    return `Didn't advance: repeats the previous plot's ${label} (${shown}) instead of moving on to ${correct}.`;
  }

  if (errorKind === "overshot") {
    const skipped = labelFor(property, valueAt(rule, answerPosition + 1));
    return `Overshot the wrap: advances ${label} one step too far, landing on ${skipped} instead of ${correct}.`;
  }

  const borrowedLabel = borrowedFrom ? PROPERTY_LABEL[borrowedFrom] : "another property";
  const borrowedPeriod = borrowedFrom ? ruleset[borrowedFrom].sequence.length : rule.sequence.length;
  const wrong = labelFor(property, rule.sequence[(rule.startOffset + answerPosition) % borrowedPeriod % rule.sequence.length]);
  return `Wrong clock: advances ${label} using ${borrowedLabel}'s period instead of its own, landing on ${wrong} instead of ${correct}.`;
}
