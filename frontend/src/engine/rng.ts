// Deterministic, seeded pseudo-random generator (mulberry32) plus the numeric
// helpers the engine needs. Seeding makes every simulation reproducible, exactly
// like the NumPy default_rng used in the Python reference engine.

export class RNG {
  private state: number;

  constructor(seed: number) {
    // mix the seed so small seeds still produce well-distributed streams
    this.state = (seed ^ 0x9e3779b9) >>> 0;
  }

  /** Uniform float in [0, 1). */
  random(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform float in [lo, hi). */
  uniform(lo: number, hi: number): number {
    return lo + (hi - lo) * this.random();
  }

  /** Standard-normal sample via Box-Muller. */
  normal(mean = 0, std = 1): number {
    const u1 = Math.max(this.random(), 1e-12);
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.random() * n);
  }

  /** Pick one element of an array. */
  choice<T>(arr: T[]): T {
    return arr[this.int(arr.length)];
  }
}

/** Evenly spaced values over a linear interval (NumPy linspace). */
export function linspace(start: number, stop: number, n: number): number[] {
  if (n <= 1) return [start];
  const step = (stop - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
}

/** Evenly spaced values over a log interval (NumPy geomspace). */
export function geomspace(start: number, stop: number, n: number): number[] {
  const ls = Math.log(start);
  const le = Math.log(stop);
  return linspace(ls, le, n).map((x) => Math.exp(x));
}

export function clip(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
