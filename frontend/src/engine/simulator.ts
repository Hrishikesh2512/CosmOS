// The Genesis simulator: orchestrates the eight cosmic stages in the browser.
// Mirrors backend/genesis/engine/simulator.py.

import { RNG, clip } from "./rng";
import { effective } from "./parameters";
import * as dim from "./dimensions";
import { expansionHistory } from "./cosmology";
import { primordialAbundances } from "./nucleosynthesis";
import { formStructure } from "./structure";
import { stellarProfile, initialMassFunction } from "./stars";
import { formPlanets } from "./planets";
import { evaluateChemistry } from "./chemistry";
import { evaluateLife } from "./life";
import { simulateCivilization } from "./civilization";
import { buildScorecard } from "./scorecard";
import { buildTimeline } from "./timeline";
import type {
  UniverseParameters, SimulationResult, StageResult, Visualization, VizPlanet,
} from "../types";

export function simulate(params: UniverseParameters): SimulationResult {
  const t0 = performance.now();
  const ec = effective(params);
  const stages: StageResult[] = [];
  const dprof = dim.profile(ec.dimensions);

  // Stage 1: Big Bang
  const exp = expansionHistory(ec);
  stages.push({
    index: 1, name: "Big Bang", success: true,
    summary: `Universe expands; fate: ${exp.fate}.`,
    data: {
      fate: exp.fate, age_gyr: exp.age_gyr, will_recollapse: exp.will_recollapse,
      recollapse_time_gyr: exp.recollapse_time_gyr, growth_factor: exp.growth_factor,
      omega_total: exp.omega_total, scale_factor: exp.scale_factor, time_gyr: exp.time_gyr,
    },
  });

  // Stage 2: Particle / nucleosynthesis
  const bbn = primordialAbundances(ec);
  stages.push({ index: 2, name: "Particle Formation", success: bbn.viable, summary: bbn.note, data: { ...bbn } });

  // Stage 3: Structure
  const struct = formStructure(ec, exp);
  stages.push({ index: 3, name: "Structure Formation", success: struct.galaxies_form, summary: struct.note, data: { ...struct } });

  // Stage 4: Stars
  const sprof = stellarProfile(ec);
  const imf = initialMassFunction(sprof, 2000, params.seed);
  stages.push({ index: 4, name: "Star Formation", success: sprof.stars_possible, summary: sprof.note, data: { ...sprof, imf_sample: imf.slice(0, 200) } });

  // Stage 5: Planets
  const pl = formPlanets(ec, sprof, bbn, struct.structure_richness, sprof.supernova_capable);
  stages.push({ index: 5, name: "Planet Formation", success: pl.rocky_worlds, summary: pl.note, data: { ...pl } });

  // Stage 6: Chemistry
  const chem = evaluateChemistry(ec, pl, bbn);
  stages.push({ index: 6, name: "Chemistry", success: chem.complexity_score > 0.2, summary: chem.note, data: { ...chem } });

  // Stage 7: Life
  const lf = evaluateLife(chem, pl, sprof, exp, struct.first_galaxy_gyr);
  stages.push({ index: 7, name: "Life Emergence", success: lf.emerges, summary: lf.note, data: { ...lf } });

  // Stage 8: Civilization
  const civ = simulateCivilization(lf, lf.time_available_gyr, params.seed);
  stages.push({ index: 8, name: "Civilization Emergence", success: civ.civilizations_emerge, summary: civ.note, data: { ...civ } });

  const scorecard = buildScorecard(exp, bbn, struct, sprof, pl, chem, lf, civ);
  const timeline = buildTimeline(exp, struct, sprof, pl, lf, civ);
  const visualization = buildVisualization(params, exp, struct, pl, civ, imf);

  return {
    universe_id: scorecard.universe_id,
    parameters: params,
    effective_constants: ec as unknown as Record<string, number>,
    dimensional_profile: dprof,
    stages,
    timeline,
    scorecard,
    visualization,
    compute_time_ms: performance.now() - t0,
  };
}

function buildVisualization(
  params: UniverseParameters, exp: any, struct: any,
  pl: any, civ: any, imf: number[]
): Visualization {
  const rng = new RNG(params.seed + 7);

  // Universe view: galaxies clustered around cosmic-web nodes.
  const nGal = Math.round(clip(struct.n_galaxies_estimate * 400, 0, 4000));
  const galaxies: number[][] = [];
  const brightness: number[] = [];
  if (struct.galaxies_form && nGal > 0) {
    const nNodes = Math.max(1, Math.floor(nGal / 40));
    const nodes: number[][] = [];
    for (let i = 0; i < nNodes; i++) nodes.push([rng.normal(0, 60), rng.normal(0, 60), rng.normal(0, 60)]);
    for (let i = 0; i < nGal; i++) {
      const n = nodes[rng.int(nNodes)];
      galaxies.push([n[0] + rng.normal(0, 8), n[1] + rng.normal(0, 8), n[2] + rng.normal(0, 8)]);
      brightness.push(rng.uniform(0.3, 1.0));
    }
  }

  // Galaxy view: stars on spiral arms.
  const nStars = Math.min(imf.length, 3000);
  const starsXyz: number[][] = [];
  const masses: number[] = [];
  for (let i = 0; i < nStars; i++) {
    const m = imf[i];
    const r = Math.sqrt(rng.uniform(0, 40)) * 6;
    const theta = rng.uniform(0, 2 * Math.PI);
    const arm = (theta + r * 0.3) % (2 * Math.PI);
    starsXyz.push([r * Math.cos(arm) + rng.normal(0, 2), rng.normal(0, 1.5), r * Math.sin(arm) + rng.normal(0, 2)]);
    masses.push(m);
  }

  // Solar system view: planet orbits.
  const nPlanets = pl.gas_giants ? Math.round(clip(pl.n_rocky_per_star + 2, 0, 12)) : 0;
  const planets: VizPlanet[] = [];
  for (let i = 0; i < nPlanets; i++) {
    const a = 0.4 + i * 0.5 + rng.uniform(0, 0.2);
    planets.push({
      semi_major_au: a,
      radius_earth: rng.uniform(0.3, 11),
      is_rocky: a < pl.habitable_zone_width_au * 6 + 2,
      in_habitable_zone: Math.abs(a - 1.0) < pl.habitable_zone_width_au * 3,
    });
  }

  const stride = <T,>(arr: T[], s: number) => arr.filter((_, i) => i % s === 0);

  return {
    universe: { galaxies, brightness, expansion_rate: exp.hubble.length ? exp.hubble[exp.hubble.length - 1] : 0, count: nGal },
    galaxy: { stars: starsXyz, masses, count: nStars },
    solar_system: { planets, habitable_zone_au: pl.habitable_zone_width_au },
    civilization: {
      timeline_years: stride(civ.timeline_years, 4),
      population: stride(civ.population, 4),
      tech: stride(civ.tech, 4),
      expansion: stride(civ.expansion, 4),
      extinction_events: civ.extinction_events,
    },
  };
}
