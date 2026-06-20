// Large-scale structure formation. Mirrors backend/genesis/physics/structure.py.

import { clip } from "./rng";
import * as dim from "./dimensions";
import type { EffectiveConstants } from "./parameters";
import type { ExpansionHistory } from "./cosmology";

export interface StructureResult {
  galaxies_form: boolean;
  clusters_form: boolean;
  structure_richness: number;
  first_galaxy_gyr: number;
  n_galaxies_estimate: number;
  dark_matter_scaffold: number;
  note: string;
}

export function formStructure(
  ec: EffectiveConstants, exp: ExpansionHistory
): StructureResult {
  const dprof = dim.profile(ec.dimensions);
  const dmFrac = ec.omega_dm / Math.max(ec.omega_m, 1e-9);
  const scaffold = 0.2 + 0.8 * dmFrac;

  let richness =
    clip(exp.growth_factor, 0, 1.5) *
    scaffold *
    dprof.structure_factor *
    Math.min(1, ec.omega_m / 0.3);
  richness = clip(richness, 0, 1);

  const galaxies = richness > 0.15 && dprof.stable_orbits;
  const clusters = richness > 0.35 && galaxies;

  let firstGalaxy = NaN;
  if (galaxies) {
    firstGalaxy = 1 / (0.3 + 0.9 * scaffold * Math.min(1, ec.omega_m / 0.3));
    firstGalaxy = Math.max(
      0.2,
      Math.min(firstGalaxy, exp.age_gyr > 0 ? exp.age_gyr * 0.8 : 5.0)
    );
  }

  const nGal = richness * (1 + 2 * (ec.omega_m / 0.3));

  let note: string;
  if (!dprof.stable_orbits) note = `${ec.dimensions}D space cannot host bound galaxies.`;
  else if (dmFrac < 0.05)
    note = "Negligible dark matter: structure grows slowly; galaxies sparse and late.";
  else if (richness < 0.15)
    note = "Expansion or low density suppressed gravitational collapse; few galaxies.";
  else note = "Dark-matter halos seed a rich hierarchy of galaxies and clusters.";

  return {
    galaxies_form: galaxies,
    clusters_form: clusters,
    structure_richness: richness,
    first_galaxy_gyr: firstGalaxy,
    n_galaxies_estimate: nGal,
    dark_matter_scaffold: scaffold,
    note,
  };
}
