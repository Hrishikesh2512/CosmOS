// Planet formation and habitable zones. Mirrors backend/cosmos/physics/planets.py.

import * as K from "./constants";
import * as dim from "./dimensions";
import type { EffectiveConstants } from "./parameters";
import type { StellarProfile } from "./stars";
import type { BBNResult } from "./nucleosynthesis";

export interface PlanetResult {
  rocky_worlds: boolean;
  gas_giants: boolean;
  moons: boolean;
  metallicity: number;
  habitable_zone_width_au: number;
  n_rocky_per_star: number;
  n_habitable_per_star: number;
  note: string;
}

export function formPlanets(
  ec: EffectiveConstants,
  stars: StellarProfile,
  bbn: BBNResult,
  structureRichness: number,
  supernovaSeeded: boolean
): PlanetResult {
  const dprof = dim.profile(ec.dimensions);

  if (!stars.stars_possible || !dprof.stable_orbits) {
    return {
      rocky_worlds: false, gas_giants: false, moons: false, metallicity: 0,
      habitable_zone_width_au: 0, n_rocky_per_star: 0, n_habitable_per_star: 0,
      note: "No stable orbits or no stars: planets cannot form.",
    };
  }

  let metallicity = 0;
  if (supernovaSeeded)
    metallicity = Math.min(
      1, 0.4 * structureRichness + 0.6 * Math.min(1, structureRichness * 2)
    );
  metallicity = Math.max(bbn.metals_seed, metallicity);

  const rocky = metallicity > 0.05;
  const gasGiants = metallicity > 0.02;
  const moons = rocky && dprof.stable_orbits;

  const alphaRatio = ec.alpha / K.ALPHA_FS;
  const chemBand = Math.exp(-(Math.log(alphaRatio) ** 2) / (2 * 0.25 ** 2));
  const hzWidth = 0.3 * chemBand;

  const nRocky = rocky ? 3 * metallicity : 0;
  const nHab = nRocky * 0.25 * chemBand;

  let note: string;
  if (!rocky) note = "Too few heavy elements to build rocky worlds; only gas/ice possible.";
  else if (chemBand < 0.2)
    note = "Chemistry mistuned (alpha far from baseline): negligible liquid-water zone.";
  else note = "Metal-rich disks form rocky planets, gas giants and moons with viable HZs.";

  return {
    rocky_worlds: rocky,
    gas_giants: gasGiants,
    moons,
    metallicity,
    habitable_zone_width_au: hzWidth,
    n_rocky_per_star: nRocky,
    n_habitable_per_star: nHab,
    note,
  };
}
