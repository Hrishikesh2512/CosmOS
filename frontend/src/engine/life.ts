// Life emergence. Mirrors backend/genesis/physics/life.py.

import type { ChemistryResult } from "./chemistry";
import type { PlanetResult } from "./planets";
import type { StellarProfile } from "./stars";
import type { ExpansionHistory } from "./cosmology";

export interface LifeResult {
  probability: number;
  biological_complexity: number;
  emerges: boolean;
  time_available_gyr: number;
  first_life_gyr: number;
  note: string;
}

const T_BIOGENESIS = 0.5;
const T_COMPLEX = 3.5;

export function evaluateLife(
  chem: ChemistryResult,
  planets: PlanetResult,
  stars: StellarProfile,
  exp: ExpansionHistory,
  structureFirstGalaxyGyr: number
): LifeResult {
  if (!(chem.carbon_chemistry && chem.water_stable && planets.rocky_worlds)) {
    return {
      probability: 0, biological_complexity: 0, emerges: false,
      time_available_gyr: 0, first_life_gyr: NaN,
      note: "Missing prerequisites: needs carbon chemistry, water and rocky worlds.",
    };
  }

  const planetReady =
    (Number.isNaN(structureFirstGalaxyGyr) ? 2.0 : structureFirstGalaxyGyr) + 1.0;
  const starDeath =
    stars.longest_lifetime_gyr > 0 ? stars.longest_lifetime_gyr : stars.typical_lifetime_gyr;
  const universeEnd =
    exp.will_recollapse && exp.recollapse_time_gyr ? exp.recollapse_time_gyr : 1e4;
  const windowEnd = Math.min(starDeath, universeEnd);
  const timeAvailable = Math.max(0, windowEnd - planetReady);

  if (timeAvailable < T_BIOGENESIS) {
    return {
      probability: 0, biological_complexity: 0, emerges: false,
      time_available_gyr: timeAvailable, first_life_gyr: NaN,
      note: `Stars or the universe die before life can arise (only ${timeAvailable.toFixed(2)} Gyr available).`,
    };
  }

  const hab = planets.n_habitable_per_star;
  const pChem = chem.complexity_score;
  const pTime = 1 - Math.exp(-timeAvailable / 2);
  const pRealEstate = 1 - Math.exp(-3 * Math.max(hab, 0));

  let probability = pChem * pTime * pRealEstate;
  probability = Math.max(0, Math.min(1, probability));

  let complexity =
    timeAvailable >= T_COMPLEX
      ? probability * (1 - Math.exp(-(timeAvailable - T_COMPLEX) / 3))
      : probability * 0.1;
  complexity = Math.max(0, Math.min(1, complexity));

  const emerges = probability > 0.05;
  const firstLife = emerges ? planetReady + T_BIOGENESIS : NaN;

  const note = emerges
    ? `Life can emerge ~${firstLife.toFixed(1)} Gyr in, with ${timeAvailable.toFixed(1)} Gyr to evolve.`
    : "Conditions allow chemistry but biogenesis probability is negligible.";

  return {
    probability,
    biological_complexity: complexity,
    emerges,
    time_available_gyr: timeAvailable,
    first_life_gyr: firstLife,
    note,
  };
}
