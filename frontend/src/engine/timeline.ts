// Cosmic timeline. Mirrors backend/genesis/engine/timeline.py.

import type { TimelineEvent } from "../types";
import type { ExpansionHistory } from "./cosmology";
import type { StructureResult } from "./structure";
import type { StellarProfile } from "./stars";
import type { PlanetResult } from "./planets";
import type { LifeResult } from "./life";
import type { CivilizationResult } from "./civilization";

function label(gyr: number): string {
  if (Number.isNaN(gyr)) return "-";
  const yr = gyr * 1e9;
  if (yr < 1) return `${(yr * 1e9).toFixed(0)} yr`;
  if (yr < 1e6) return `${Math.round(yr).toLocaleString()} years`;
  if (yr < 1e9) return `${(yr / 1e6).toFixed(0)} million years`;
  return `${(yr / 1e9).toFixed(2)} billion years`;
}

export function buildTimeline(
  exp: ExpansionHistory, struct: StructureResult, sprof: StellarProfile,
  pl: PlanetResult, lf: LifeResult, civ: CivilizationResult
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({ time_years: 0, time_label: "0 years", title: "Big Bang",
    description: `Space, time and energy emerge. ${exp.fate}`, stage: 1 });
  events.push({ time_years: 3.8e5, time_label: "380,000 years", title: "Recombination",
    description: "Atoms form; the universe becomes transparent.", stage: 2 });

  if (struct.galaxies_form && !Number.isNaN(struct.first_galaxy_gyr)) {
    const t = struct.first_galaxy_gyr;
    events.push({ time_years: t * 1e9, time_label: label(t), title: "First galaxies mature", description: struct.note, stage: 3 });
  }

  if (sprof.stars_possible) {
    const firstStar = struct.galaxies_form ? struct.first_galaxy_gyr * 0.3 : 0.3;
    events.push({ time_years: firstStar * 1e9, time_label: label(firstStar), title: "First stars ignite",
      description: `Stars of ${sprof.min_star_mass_sun.toFixed(2)}-${sprof.max_star_mass_sun.toFixed(0)} M_sun light up.`, stage: 4 });
    if (sprof.supernova_capable) {
      const sn = firstStar + Math.min(0.1, sprof.typical_lifetime_gyr);
      events.push({ time_years: sn * 1e9, time_label: label(sn), title: "First supernovae",
        description: "Massive stars explode, seeding heavy elements.", stage: 4 });
    }
  }

  if (pl.rocky_worlds && struct.galaxies_form) {
    const t = (Number.isNaN(struct.first_galaxy_gyr) ? 2.0 : struct.first_galaxy_gyr) + 1.0;
    events.push({ time_years: t * 1e9, time_label: label(t), title: "Rocky planets form", description: pl.note, stage: 5 });
  }

  if (lf.emerges && !Number.isNaN(lf.first_life_gyr))
    events.push({ time_years: lf.first_life_gyr * 1e9, time_label: label(lf.first_life_gyr), title: "Life emerges", description: lf.note, stage: 7 });

  if (civ.civilizations_emerge && !Number.isNaN(civ.first_civ_gyr))
    events.push({ time_years: civ.first_civ_gyr * 1e9, time_label: label(civ.first_civ_gyr), title: "Civilizations emerge", description: civ.outcome, stage: 8 });

  if (exp.will_recollapse && exp.recollapse_time_gyr)
    events.push({ time_years: exp.recollapse_time_gyr * 1e9, time_label: label(exp.recollapse_time_gyr), title: "Big Crunch", description: "The universe recollapses to a singularity.", stage: 1 });

  events.sort((a, b) => a.time_years - b.time_years);
  return events;
}
