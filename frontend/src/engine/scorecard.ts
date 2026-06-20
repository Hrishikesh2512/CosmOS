// Universe scorecard. Mirrors backend/genesis/engine/scorecard.py.

import type { Scorecard } from "../types";
import type { ExpansionHistory } from "./cosmology";
import type { BBNResult } from "./nucleosynthesis";
import type { StructureResult } from "./structure";
import type { StellarProfile } from "./stars";
import type { PlanetResult } from "./planets";
import type { ChemistryResult } from "./chemistry";
import type { LifeResult } from "./life";
import type { CivilizationResult } from "./civilization";

let counter = 0;
export function resetCounter(): void { counter = 0; }

export function buildScorecard(
  exp: ExpansionHistory, bbn: BBNResult, struct: StructureResult,
  sprof: StellarProfile, pl: PlanetResult, chem: ChemistryResult,
  lf: LifeResult, civ: CivilizationResult
): Scorecard {
  const number = ++counter;
  const uid = `universe-${String(number).padStart(6, "0")}`;

  const starsOk = sprof.stars_possible;
  const galaxiesOk = struct.galaxies_form;
  const planetsOk = pl.rocky_worlds;
  const chemOk = chem.complexity_score > 0.2;
  const lifeOk = lf.emerges;
  const intelOk = civ.intelligence_emerges;
  const civOk = civ.civilizations_emerge;

  const weights: [number, boolean][] = [
    [0.1, !exp.will_recollapse || (exp.recollapse_time_gyr ?? 0) > 5],
    [0.1, bbn.viable],
    [0.12, galaxiesOk],
    [0.15, starsOk],
    [0.13, planetsOk],
    [0.15, chemOk],
    [0.15, lifeOk],
    [0.1, civOk],
  ];
  const habitability = weights.reduce((s, [w, ok]) => s + (ok ? w : 0), 0);

  let outcome: string;
  if (civOk) outcome = "Civilization-bearing universe.";
  else if (lifeOk) outcome = "Life-bearing universe.";
  else if (chemOk && planetsOk) outcome = "Habitable-chemistry universe (no life detected).";
  else if (starsOk) outcome = "Star-and-galaxy universe (sterile).";
  else if (galaxiesOk) outcome = "Structure-only universe (no stars).";
  else outcome = "Barren universe.";

  const highlights: string[] = [];
  if (sprof.stars_possible)
    highlights.push(`Stable star masses: ${sprof.min_star_mass_sun.toFixed(2)}-${sprof.max_star_mass_sun.toFixed(0)} M_sun.`);
  if (chem.stable_elements) highlights.push(`${chem.stable_elements} stable elements accessible.`);
  if (lf.emerges)
    highlights.push(`Life probability ${Math.round(lf.probability * 100)}%, ${lf.time_available_gyr.toFixed(1)} Gyr to evolve.`);
  if (civ.civilizations_emerge)
    highlights.push(`~${civ.n_civilizations_estimate.toFixed(0)} civilizations; peak tech ${civ.peak_tech_level.toFixed(1)}/10.`);
  if (exp.will_recollapse) highlights.push("Universe recollapses in a Big Crunch.");

  return {
    universe_id: uid, number,
    stars: starsOk, galaxies: galaxiesOk, planets: planetsOk,
    chemistry: chemOk, life: lifeOk, intelligence: intelOk,
    civilizations: civOk, outcome,
    habitability_index: Math.round(habitability * 1000) / 1000,
    highlights,
  };
}
