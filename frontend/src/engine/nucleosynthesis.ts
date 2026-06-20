// Big Bang nucleosynthesis. Mirrors backend/cosmos/physics/nucleosynthesis.py.

import * as K from "./constants";
import { clip } from "./rng";
import type { EffectiveConstants } from "./parameters";

export interface BBNResult {
  helium_fraction: number;
  hydrogen_fraction: number;
  metals_seed: number;
  np_ratio_freeze: number;
  freeze_temp_k: number;
  viable: boolean;
  note: string;
}

const T_FREEZE_BASE = 1.16e10;
const Q_OVER_K = K.M_NEUTRON_PROTON_DIFF / K.K_BOLTZMANN;

export function primordialAbundances(ec: EffectiveConstants): BBNResult {
  const gScale = Math.sqrt(ec.G / K.G_NEWTON);
  const tFreeze = T_FREEZE_BASE * gScale ** (1 / 3);
  const npRatio = Math.exp(-Q_OVER_K / tFreeze);
  const decayFactor = Math.exp(-0.2 / Math.max(gScale, 0.1));
  const x = npRatio * decayFactor;
  const yP = clip((2 * x) / (1 + x), 0, 0.95);
  const hFrac = 1 - yP;
  const metalsSeed = 1e-9 * (1 + 5 * Math.max(0, gScale - 1));

  const viable = hFrac >= 0.15 && hFrac <= 0.95;
  let note: string;
  if (hFrac < 0.15)
    note = "Helium-dominated universe: no hydrogen for water or organic chemistry.";
  else if (hFrac > 0.95)
    note = "Almost pure hydrogen: little primordial helium, slow early star fuel mix.";
  else note = "Hydrogen/helium mix permits rich downstream chemistry.";

  return {
    helium_fraction: yP,
    hydrogen_fraction: hFrac,
    metals_seed: metalsSeed,
    np_ratio_freeze: npRatio,
    freeze_temp_k: tFreeze,
    viable,
    note,
  };
}
