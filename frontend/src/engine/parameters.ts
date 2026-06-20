// Universe parameter model and resolution into effective physical constants.
// Mirrors backend/genesis/physics/parameters.py.

import * as K from "./constants";
import type { UniverseParameters, MatterDensity } from "../types";

export interface EffectiveConstants {
  c: number;
  G: number;
  h: number;
  hbar: number;
  e: number;
  alpha: number;
  epsilon_0: number;
  k_B: number;
  m_proton: number;
  m_electron: number;
  m_neutron: number;
  dimensions: number;
  omega_m: number;
  omega_b: number;
  omega_dm: number;
  omega_lambda: number;
  omega_r: number;
  H0: number;
}

const DENSITY_SCALE: Record<MatterDensity, number> = {
  near_empty: 0.05,
  sparse: 0.4,
  moderate: 1.0,
  dense: 3.0,
  extreme: 12.0,
};

export function validateParams(p: UniverseParameters): void {
  if (p.dimensions < 1 || p.dimensions > 5)
    throw new Error("dimensions must be in 1..5");
  for (const f of ["c_mult", "G_mult", "h_mult", "e_mult", "alpha_mult"] as const) {
    if (p[f] <= 0) throw new Error(`${f} must be > 0`);
  }
  if (p.dark_matter_fraction < 0 || p.dark_matter_fraction > 0.95)
    throw new Error("dark_matter_fraction must be in 0..0.95");
  if (p.dark_energy_strength < 0 || p.dark_energy_strength > 100)
    throw new Error("dark_energy_strength must be in 0..100");
}

export function effective(p: UniverseParameters): EffectiveConstants {
  validateParams(p);
  const c = K.C_LIGHT * p.c_mult;
  const G = K.G_NEWTON * p.G_mult;
  const h = K.H_PLANCK * p.h_mult;
  const hbar = h / (2 * Math.PI);
  const e = K.E_CHARGE * p.e_mult;
  const alpha = K.ALPHA_FS * p.alpha_mult;

  // alpha = e^2 / (4 pi eps0 hbar c)  =>  eps0 = e^2 / (4 pi alpha hbar c)
  const epsilon_0 = e ** 2 / (4 * Math.PI * alpha * hbar * c);

  const dmFrac =
    p.baryonic_fraction != null
      ? Math.max(0, 1 - p.baryonic_fraction)
      : p.dark_matter_fraction;

  const omega_m = K.OMEGA_M * DENSITY_SCALE[p.matter_density];
  const omega_b = omega_m * (1 - dmFrac);
  const omega_dm = omega_m * dmFrac;
  const omega_lambda = K.OMEGA_LAMBDA * p.dark_energy_strength;

  return {
    c, G, h, hbar, e, alpha, epsilon_0,
    k_B: K.K_BOLTZMANN,
    m_proton: K.M_PROTON, m_electron: K.M_ELECTRON, m_neutron: K.M_NEUTRON,
    dimensions: p.dimensions,
    omega_m, omega_b, omega_dm, omega_lambda, omega_r: K.OMEGA_R, H0: K.H0_SI,
  };
}

export function baseline(): UniverseParameters {
  return {
    c_mult: 1, G_mult: 1, h_mult: 1, e_mult: 1, alpha_mult: 1,
    dimensions: 3, matter_density: "moderate",
    dark_matter_fraction: K.OMEGA_DM / K.OMEGA_M,
    dark_energy_strength: 1, baryonic_fraction: null,
    name: "Baseline (Our Universe)", seed: 0,
  };
}
