"""
Big Bang Nucleosynthesis (BBN).

The primordial helium fraction is set by the neutron-to-proton ratio frozen in
when the weak interaction rate drops below the expansion rate. That freeze-out
temperature depends on the expansion rate (and hence on G), and the neutron
fraction then decays until deuterium can form and lock neutrons into helium-4.

We implement a physically-motivated reduced model:

    n/p|freeze = exp(-Q / kT_freeze),   Q = (m_n - m_p) c^2

with T_freeze rising as gravity (expansion rate) increases, because faster
expansion freezes out the weak interactions earlier (at higher T), leaving more
neutrons and thus more helium. The result gates the chemistry available to the
universe: a hydrogen-poor or all-helium universe cannot form water or organic
chemistry.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from . import constants as K
from .parameters import EffectiveConstants


@dataclass
class BBNResult:
    helium_fraction: float        # Y_p, mass fraction of He-4
    hydrogen_fraction: float      # X, mass fraction of H
    metals_seed: float            # trace heavier primordial nuclei (mass frac)
    np_ratio_freeze: float        # neutron/proton ratio at freeze-out
    freeze_temp_k: float          # weak freeze-out temperature [K]
    viable: bool                  # can normal chemistry proceed?
    note: str


# Baseline weak freeze-out temperature ~ 1 MeV ~ 1.16e10 K
_T_FREEZE_BASE = 1.16e10
# Q value as temperature: Q/k
_Q_OVER_K = K.M_NEUTRON_PROTON_DIFF / K.K_BOLTZMANN


def primordial_abundances(ec: EffectiveConstants) -> BBNResult:
    g_scale = math.sqrt(ec.G / K.G_NEWTON)

    # Weak rate ~ T^5; expansion rate H ~ sqrt(G) T^2. Freeze-out when equal:
    # T_freeze ~ (H / G_F-rate)^(1/3) -> scales ~ g_scale^(1/3).
    t_freeze = _T_FREEZE_BASE * g_scale ** (1.0 / 3.0)

    # neutron/proton ratio at freeze-out
    np_ratio = math.exp(-_Q_OVER_K / t_freeze)

    # neutrons decay until deuterium forms (~3 min); shorter for fast expansion.
    # Approximate residual neutron fraction after partial decay.
    decay_factor = math.exp(-0.2 / max(g_scale, 0.1))
    n_frac = np_ratio * decay_factor

    # Essentially all surviving neutrons -> He-4: Y_p = 2n / (n + p) = 2x/(1+x)
    x = n_frac
    y_p = 2.0 * x / (1.0 + x)
    y_p = float(np.clip(y_p, 0.0, 0.95))

    h_frac = 1.0 - y_p
    metals_seed = 1e-9 * (1.0 + 5.0 * max(0.0, g_scale - 1.0))  # trace Li/Be

    # Viability: need substantial hydrogen for water/organics, but not so
    # neutron-rich that everything is helium.
    viable = 0.15 <= h_frac <= 0.95
    if h_frac < 0.15:
        note = "Helium-dominated universe: no hydrogen for water or organic chemistry."
    elif h_frac > 0.95:
        note = "Almost pure hydrogen: little primordial helium, slow early star fuel mix."
    else:
        note = "Hydrogen/helium mix permits rich downstream chemistry."

    return BBNResult(
        helium_fraction=y_p,
        hydrogen_fraction=h_frac,
        metals_seed=metals_seed,
        np_ratio_freeze=np_ratio,
        freeze_temp_k=t_freeze,
        viable=viable,
        note=note,
    )


__all__ = ["BBNResult", "primordial_abundances"]
