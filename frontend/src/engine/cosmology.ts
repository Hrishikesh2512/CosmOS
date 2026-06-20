// Cosmology: expansion history and structure growth.
// Mirrors backend/cosmos/physics/cosmology.py. The scipy solve_ivp call is
// replaced with a fixed-step RK4 integrator plus an analytic turning-point scan.

import * as K from "./constants";
import { geomspace } from "./rng";
import type { EffectiveConstants } from "./parameters";

export interface ExpansionHistory {
  age_gyr: number;
  scale_factor: number[];
  time_gyr: number[];
  hubble: number[];
  will_recollapse: boolean;
  recollapse_time_gyr: number | null;
  fate: string;
  growth_factor: number;
  omega_total: number;
}

function hubbleSq(
  a: number, ec: EffectiveConstants, H0: number, omegaK: number
): number {
  return (
    H0 ** 2 *
    (ec.omega_r * a ** -4 +
      ec.omega_m * a ** -3 +
      ec.omega_lambda +
      omegaK * a ** -2)
  );
}

export function expansionHistory(ec: EffectiveConstants): ExpansionHistory {
  const gScale = Math.sqrt(ec.G / K.G_NEWTON);
  const H0 = ec.H0 * gScale;

  const omegaTotal = ec.omega_r + ec.omega_m + ec.omega_lambda;
  // Curvature closes the matter budget (dark energy stays a separate component).
  const omegaK = 1.0 - (ec.omega_r + ec.omega_m);

  const a0 = 1e-3;
  const tMax = 80.0 * K.GYR;

  // Analytic turning-point detection: first a where H^2 <= 0.
  const aScan = geomspace(a0, 1e4, 4000);
  let recollapse = false;
  let aTurn: number | null = null;
  for (const a of aScan) {
    if (hubbleSq(a, ec, H0, omegaK) <= 0) {
      aTurn = a;
      recollapse = true;
      break;
    }
  }

  // Integrate da/dt = a * sqrt(H^2) with fixed-step RK4 until turnaround/tMax.
  const N = 4000;
  const dt = tMax / N;
  const deriv = (a: number) => {
    const h2 = hubbleSq(a, ec, H0, omegaK);
    return h2 > 0 ? a * Math.sqrt(h2) : 0;
  };

  const aArr: number[] = [a0];
  const tArr: number[] = [0];
  let a = a0;
  let t = 0;
  for (let i = 0; i < N; i++) {
    if (aTurn != null && a >= aTurn) break;
    const k1 = deriv(a);
    const k2 = deriv(a + 0.5 * dt * k1);
    const k3 = deriv(a + 0.5 * dt * k2);
    const k4 = deriv(a + dt * k3);
    a = a + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t = t + dt;
    aArr.push(a);
    tArr.push(t);
    if (k1 === 0) break;
  }

  let recollapseTime: number | null = null;
  let aFull = aArr.slice();
  let tFull = tArr.slice();
  if (recollapse) {
    const tTurn = tArr[tArr.length - 1];
    recollapseTime = (2 * tTurn) / K.GYR;
    // mirror the collapse branch (time symmetry of the Friedmann equation)
    for (let i = aArr.length - 2; i >= 0; i--) {
      aFull.push(aArr[i]);
      tFull.push(2 * tTurn - tArr[i]);
    }
  }

  const hubble = aFull.map((av) =>
    Math.sqrt(Math.max(hubbleSq(av, ec, H0, omegaK), 0))
  );

  // Age ~ time to reach a = 1 during expansion, else age at peak.
  let peakIdx = 0;
  for (let i = 1; i < aFull.length; i++) if (aFull[i] > aFull[peakIdx]) peakIdx = i;
  let ageGyr: number;
  let idxToday = -1;
  for (let i = 0; i <= peakIdx; i++) if (aFull[i] >= 1.0) { idxToday = i; break; }
  ageGyr = idxToday >= 0 ? tFull[idxToday] / K.GYR : tFull[peakIdx] / K.GYR;

  const [fate, growth] = fateAndGrowth(ec, recollapse, recollapseTime);

  // Subsample for transport (Python used [::8]).
  const subA: number[] = [];
  const subT: number[] = [];
  for (let i = 0; i < aFull.length; i += 8) { subA.push(aFull[i]); subT.push(tFull[i] / K.GYR); }

  return {
    age_gyr: ageGyr,
    scale_factor: subA,
    time_gyr: subT,
    hubble: hubble.filter((_, i) => i % 8 === 0),
    will_recollapse: recollapse,
    recollapse_time_gyr: recollapseTime,
    fate,
    growth_factor: growth,
    omega_total: omegaTotal,
  };
}

function fateAndGrowth(
  ec: EffectiveConstants,
  recollapse: boolean, recollapseTime: number | null
): [string, number] {
  const deRatio = ec.omega_lambda / Math.max(ec.omega_m, 1e-6);
  let growth = ec.omega_m / (ec.omega_m + 0.7 * ec.omega_lambda);
  growth *= 1.0 / (1.0 + 0.15 * deRatio);
  const growthNorm = growth / 0.3;

  if (recollapse && recollapseTime != null && recollapseTime < 2.0)
    return ["Big Crunch (rapid recollapse before structure forms)", growthNorm * 0.1];
  if (recollapse) return ["Big Crunch (eventual recollapse)", growthNorm];
  if (ec.omega_lambda > 30.0 * K.OMEGA_LAMBDA)
    return ["Big Rip / runaway expansion (structure torn apart)", growthNorm * 0.05];
  if (deRatio > 5.0)
    return ["Cold, empty de Sitter expansion (structure frozen early)", growthNorm * 0.4];
  return ["Open eternal expansion with structure formation", growthNorm];
}
