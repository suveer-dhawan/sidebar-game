export type RNG = () => number;

/** Deterministic PRNG so tests and audits can reproduce a puzzle from a seed. */
export function mulberry32(seed: number): RNG {
  let state = seed | 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function defaultRng(): RNG {
  return Math.random;
}

export function randInt(rng: RNG, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

export function pickOne<T>(rng: RNG, options: readonly T[]): T {
  return options[randInt(rng, options.length)];
}

/** Samples `n` distinct values from `options` without replacement, in random order. */
export function sampleDistinct<T>(rng: RNG, options: readonly T[], n: number): T[] {
  const pool = [...options];
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = randInt(rng, pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function shuffle<T>(rng: RNG, options: readonly T[]): T[] {
  return sampleDistinct(rng, options, options.length);
}
