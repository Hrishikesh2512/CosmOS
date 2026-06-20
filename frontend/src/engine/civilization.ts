// Civilization emergence. Mirrors backend/genesis/physics/civilization.py.

import { RNG } from "./rng";
import type { LifeResult } from "./life";

export interface ExtinctionEvent {
  year: number;
  severity: number;
  tech_level: number;
  cause: string;
}

export interface CivilizationResult {
  intelligence_emerges: boolean;
  civilizations_emerge: boolean;
  n_civilizations_estimate: number;
  peak_tech_level: number;
  first_civ_gyr: number;
  timeline_years: number[];
  population: number[];
  tech: number[];
  expansion: number[];
  extinction_events: ExtinctionEvent[];
  outcome: string;
  note: string;
}

function complexLag(timeAvailable: number): number {
  return Math.min(4.0, timeAvailable * 0.6);
}

function extinctionCause(rng: RNG, tech: number): string {
  const natural = ["asteroid impact", "supervolcano", "nearby supernova", "gamma-ray burst", "climate collapse"];
  const artificial = ["nuclear war", "engineered pathogen", "runaway AI", "ecological overshoot", "resource exhaustion"];
  const pool = tech < 4 ? natural : rng.random() < 0.6 ? artificial : natural;
  return rng.choice(pool);
}

export function simulateCivilization(
  life: LifeResult, timeAvailableGyr: number, seed = 0
): CivilizationResult {
  const empty: CivilizationResult = {
    intelligence_emerges: false, civilizations_emerge: false,
    n_civilizations_estimate: 0, peak_tech_level: 0, first_civ_gyr: NaN,
    timeline_years: [], population: [], tech: [], expansion: [],
    extinction_events: [], outcome: "", note: "",
  };

  if (!life.emerges || life.biological_complexity < 0.1) {
    return { ...empty, outcome: "No complex life -> no civilizations.",
      note: "Insufficient biological complexity for intelligence." };
  }

  const rng = new RNG(seed);
  const pIntel = life.biological_complexity * (1 - Math.exp(-timeAvailableGyr / 5));
  const intelligence = pIntel > 0.15;

  if (!intelligence) {
    return { ...empty, outcome: "Complex life persisted but never became intelligent.",
      note: `Intelligence probability ${pIntel.toFixed(2)} too low.` };
  }

  const firstCiv = life.first_life_gyr + complexLag(timeAvailableGyr);
  const nCiv = Math.max(1, pIntel * 50 * life.probability);

  const M = 200;
  const years: number[] = [];
  const tech = new Array(M).fill(0);
  const pop = new Array(M).fill(0);
  const expansion = new Array(M).fill(0);
  const extinctions: ExtinctionEvent[] = [];

  const kTech = 10.0;
  const r = 8.0 / 1e6;
  const t0 = 2e5;
  let survived = true;
  let setback = 0.0;

  for (let i = 0; i < M; i++) {
    const t = (i / (M - 1)) * 1e6;
    years.push(t);
    const base = kTech / (1 + Math.exp(-r * (t - t0)));
    tech[i] = Math.max(0, base - setback);
    pop[i] = 1e6 * (1 + tech[i]) ** 2;
    expansion[i] = Math.min(1, Math.max(0, (tech[i] - 4) / 6));
    const hazard = 0.002 * (1 + tech[i]);
    if (survived && rng.random() < hazard) {
      const sev = rng.uniform(0.3, 1.0);
      extinctions.push({ year: t, severity: sev, tech_level: tech[i], cause: extinctionCause(rng, tech[i]) });
      if (sev > 0.9) survived = false;
      else setback += sev * tech[i] * 0.5;
    }
  }

  let peakTech = Math.max(...tech);
  if (!survived) {
    let cutoff = tech.indexOf(peakTech);
    if (cutoff < 0) cutoff = M;
    for (let i = cutoff; i < M; i++) { tech[i] = 0; pop[i] = 0; expansion[i] = cutoff < expansion.length ? expansion[cutoff] : 0; }
    peakTech = Math.max(...tech);
  }

  let outcome: string;
  if (peakTech >= 7) outcome = "Spacefaring civilization (multi-system / Kardashev II-class).";
  else if (peakTech >= 4) outcome = "Planetary technological civilization.";
  else if (peakTech >= 1) outcome = "Pre-industrial intelligence.";
  else outcome = "Intelligence arose but never industrialized.";
  if (!survived) outcome += " Ended by an extinction-level event.";

  return {
    intelligence_emerges: true,
    civilizations_emerge: peakTech >= 1,
    n_civilizations_estimate: nCiv,
    peak_tech_level: peakTech,
    first_civ_gyr: firstCiv,
    timeline_years: years,
    population: pop,
    tech,
    expansion,
    extinction_events: extinctions,
    outcome,
    note: `~${nCiv.toFixed(0)} civilizations expected; peak tech ${peakTech.toFixed(1)}/10.`,
  };
}
