// Chemistry. Mirrors backend/genesis/physics/chemistry.py.

import * as K from "./constants";
import * as dim from "./dimensions";
import type { EffectiveConstants } from "./parameters";
import type { PlanetResult } from "./planets";
import type { BBNResult } from "./nucleosynthesis";

export interface ChemistryResult {
  stable_elements: number;
  complexity_score: number;
  carbon_chemistry: boolean;
  water_stable: boolean;
  bond_strength_factor: number;
  note: string;
}

export function evaluateChemistry(
  ec: EffectiveConstants, planets: PlanetResult, bbn: BBNResult
): ChemistryResult {
  const dprof = dim.profile(ec.dimensions);

  if (!dprof.stable_atoms) {
    return {
      stable_elements: 0, complexity_score: 0, carbon_chemistry: false,
      water_stable: false, bond_strength_factor: 0,
      note: `${ec.dimensions}D space: no stable electron orbitals, so no atoms.`,
    };
  }

  const alphaRatio = ec.alpha / K.ALPHA_FS;
  const zMax = 1 / ec.alpha;
  const zMaxBase = 1 / K.ALPHA_FS;
  const stableElements = Math.max(0, Math.min(118, Math.round((92 * zMax) / zMaxBase)));

  const bondStrength = alphaRatio ** 2;
  const chemBand = Math.exp(-(Math.log(alphaRatio) ** 2) / (2 * 0.2 ** 2));
  const dimPenalty = ec.dimensions === 3 ? 1.0 : 0.3;

  const hOk = bbn.hydrogen_fraction > 0.2;
  const metalsOk = planets.metallicity > 0.05;

  const carbon = stableElements >= 6 && chemBand > 0.3 && metalsOk && hOk;
  const water = hOk && chemBand > 0.25 && stableElements >= 8;

  let complexity = chemBand * dimPenalty * Math.min(1, stableElements / 92);
  complexity *= (metalsOk ? 1 : 0.2) * (hOk ? 1 : 0.3);
  complexity = Math.max(0, Math.min(1, complexity));

  let note: string;
  if (stableElements < 6) note = "Periodic table truncated: no carbon, no complex chemistry.";
  else if (!metalsOk) note = "Elements possible in principle but no metals were synthesized in stars.";
  else if (chemBand < 0.3) note = "Bond strengths mistuned (alpha off baseline): molecules unstable.";
  else if (carbon && water) note = "Rich carbon-and-water chemistry: the basis for complex molecules.";
  else note = "Limited but non-trivial chemistry.";

  return {
    stable_elements: stableElements,
    complexity_score: complexity,
    carbon_chemistry: carbon,
    water_stable: water,
    bond_strength_factor: bondStrength,
    note,
  };
}
