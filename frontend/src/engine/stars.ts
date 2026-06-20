// Stellar physics: mass window, Chandrasekhar limit, lifetimes, IMF.
// Mirrors backend/genesis/physics/stars.py.

import * as K from "./constants";
import * as dim from "./dimensions";
import { RNG } from "./rng";
import type { EffectiveConstants } from "./parameters";

export interface StellarProfile {
  chandrasekhar_mass_sun: number;
  min_star_mass_sun: number;
  max_star_mass_sun: number;
  typical_lifetime_gyr: number;
  longest_lifetime_gyr: number;
  supernova_capable: boolean;
  stars_possible: boolean;
  mass_window_width: number;
  note: string;
}

export function chandrasekharMass(ec: EffectiveConstants): number {
  const base = (K.HBAR * K.C_LIGHT / K.G_NEWTON) ** 1.5 / K.M_PROTON ** 2;
  const val = (ec.hbar * ec.c / ec.G) ** 1.5 / ec.m_proton ** 2;
  return K.CHANDRASEKHAR_SUN * (val / base);
}

export function stellarProfile(ec: EffectiveConstants): StellarProfile {
  const p = dim.profile(ec.dimensions);
  const mCh = chandrasekharMass(ec);

  let note: string;
  if (!p.stable_orbits || ec.dimensions !== 3) {
    if (ec.dimensions === 2) {
      note = "2D gravity permits marginal proto-stellar disks but weak fusion structure.";
    } else {
      note = `In ${ec.dimensions}D space gravitationally bound, long-lived stars cannot form (no stable hydrostatic equilibrium).`;
      return {
        chandrasekhar_mass_sun: mCh, min_star_mass_sun: 0, max_star_mass_sun: 0,
        typical_lifetime_gyr: 0, longest_lifetime_gyr: 0, supernova_capable: false,
        stars_possible: false, mass_window_width: 0, note,
      };
    }
  } else {
    note = "3D gravity supports a full stellar main sequence.";
  }

  const minMass = K.STAR_MIN_MASS_SUN * (mCh / K.CHANDRASEKHAR_SUN);
  const maxMass = K.STAR_MAX_MASS_SUN * (mCh / K.CHANDRASEKHAR_SUN) ** 0.5;
  const windowWidth = Math.max(0, maxMass - minMass);
  let starsPossible = windowWidth > 0.01 && minMass < 1.0;

  const gScale = ec.G / K.G_NEWTON;
  let typicalLife = 10.0 / gScale;
  const longestLife = minMass > 0 ? typicalLife * (minMass / 1.0) ** -2.5 : 0;
  let supernova = maxMass >= 8.0 && starsPossible;

  if (ec.dimensions === 2) typicalLife *= 0.5;

  if (!starsPossible)
    note = "No viable stellar mass window: stars cannot ignite or are unstable.";

  return {
    chandrasekhar_mass_sun: mCh,
    min_star_mass_sun: minMass,
    max_star_mass_sun: maxMass,
    typical_lifetime_gyr: typicalLife,
    longest_lifetime_gyr: Math.min(longestLife, 1e4),
    supernova_capable: supernova,
    stars_possible: starsPossible,
    mass_window_width: windowWidth,
    note,
  };
}

export function initialMassFunction(
  profile: StellarProfile, n = 2000, seed = 0
): number[] {
  if (!profile.stars_possible) return [];
  const rng = new RNG(seed);
  const lo = profile.min_star_mass_sun;
  const hi = profile.max_star_mass_sun;
  if (hi <= lo) return [];
  const alpha = 2.35;
  const loP = lo ** (1 - alpha);
  const hiP = hi ** (1 - alpha);
  const masses: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = rng.random();
    masses.push((u * (hiP - loP) + loP) ** (1 / (1 - alpha)));
  }
  return masses;
}
