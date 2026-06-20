"""
Cosmology: expansion history and large-scale structure growth.

Implements a flat-ish FLRW model integrating the Friedmann equation

    (a'/a)^2 = H0^2 [ Omega_r a^-4 + Omega_m a^-3 + Omega_lambda + Omega_k a^-2 ]

with the engine's effective constants. Because Genesis lets the user change G,
c and the density parameters, we rescale H0 self-consistently: the present-day
critical density tracks G, and the expansion rate responds to total density and
dark-energy strength.

Outputs feed the structure-formation, star-formation and timeline stages.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.integrate import solve_ivp

from . import constants as K
from .parameters import EffectiveConstants


@dataclass
class ExpansionHistory:
    age_gyr: float                  # age at which a = 1 (or heat death proxy)
    scale_factor: np.ndarray        # a(t)
    time_gyr: np.ndarray            # cosmic time grid [Gyr]
    hubble: np.ndarray              # H(t) [1/s]
    will_recollapse: bool           # Big Crunch?
    recollapse_time_gyr: float | None
    fate: str                       # qualitative fate label
    growth_factor: float            # linear structure growth amplitude (rel.)
    omega_total: float


def _hubble_sq(a: float, ec: EffectiveConstants, H0: float, omega_k: float) -> float:
    return H0 ** 2 * (
        ec.omega_r * a ** -4
        + ec.omega_m * a ** -3
        + ec.omega_lambda
        + omega_k * a ** -2
    )


def expansion_history(ec: EffectiveConstants, n_steps: int = 600) -> ExpansionHistory:
    """Integrate the Friedmann equation forward from the early universe.

    We rescale the effective Hubble constant by sqrt(G/G0) so that a denser /
    stronger-gravity universe expands (and can recollapse) appropriately, since
    H^2 ~ G rho.
    """
    g_scale = np.sqrt(ec.G / K.G_NEWTON)
    H0 = ec.H0 * g_scale

    omega_total = ec.omega_r + ec.omega_m + ec.omega_lambda
    # Spatial curvature reflects whether *gravitating matter* exceeds the
    # critical density: omega_k = 1 - (omega_m + omega_r). A matter-dominated
    # closed universe (omega_m > 1) recollapses; dark energy is a separate,
    # accelerating component that is NOT folded into curvature, so cranking it
    # up drives runaway expansion (a Big Rip) rather than a spurious collapse.
    omega_k = 1.0 - (ec.omega_r + ec.omega_m)

    a0 = 1e-3
    t_max = 80.0 * K.GYR

    # --- Analytic turning-point detection --------------------------------
    # The expansion halts (and the universe recollapses) at the smallest a > a0
    # where H^2(a) = 0 during the expansion phase. This is far more robust than
    # integrating through the turnaround, where da/dt ~ sqrt(H^2) -> 0 is
    # numerically singular. If H^2 stays positive out to large a, the universe
    # expands forever (dark energy eventually dominates).
    a_scan = np.geomspace(a0, 1e4, 4000)
    h2_scan = np.array([_hubble_sq(a, ec, H0, omega_k) for a in a_scan])
    recollapse = False
    recollapse_time = None
    a_turn = None
    neg = np.where(h2_scan <= 0.0)[0]
    if neg.size:
        a_turn = float(a_scan[neg[0]])
        recollapse = True

    # --- Integrate the expansion phase (up to turnaround or t_max) --------
    def rhs(t: float, y: np.ndarray) -> list[float]:
        a = max(y[0], 1e-8)
        h2 = _hubble_sq(a, ec, H0, omega_k)
        return [a * np.sqrt(h2)] if h2 > 0.0 else [0.0]

    def reach_turn(t: float, y: np.ndarray) -> float:
        return (y[0] - a_turn) if a_turn is not None else 1.0
    reach_turn.terminal = True
    reach_turn.direction = 1

    t_eval = np.linspace(0.0, t_max, n_steps)
    sol = solve_ivp(
        rhs, (0.0, t_max), [a0], t_eval=t_eval, method="RK45",
        rtol=1e-7, atol=1e-9, events=reach_turn, max_step=t_max / 400.0,
    )

    a_t = sol.y[0]
    t_s = sol.t

    if recollapse:
        # By time symmetry of the Friedmann equation, the collapse mirrors the
        # expansion: total lifetime ~ 2 * time-to-turnaround.
        t_turn = float(sol.t[-1])
        recollapse_time = 2.0 * t_turn / K.GYR
        # Build a symmetric collapse branch for visualization/timeline.
        a_collapse = a_t[::-1][1:]
        t_collapse = (2.0 * t_turn - t_s[::-1][1:])
        a_t = np.concatenate([a_t, a_collapse])
        t_s = np.concatenate([t_s, t_collapse])

    hubble = np.array([np.sqrt(max(_hubble_sq(a, ec, H0, omega_k), 0.0)) for a in a_t])

    # "Age" ~ time to reach a = 1 (today-equivalent), else age at peak/crunch.
    peak_idx = int(np.argmax(a_t))
    idx_today = int(np.searchsorted(a_t[:peak_idx + 1], 1.0))
    if idx_today <= peak_idx and idx_today < len(t_s):
        age_gyr = float(t_s[idx_today] / K.GYR)
    else:
        age_gyr = float(t_s[peak_idx] / K.GYR)

    fate, growth = _fate_and_growth(omega_total, ec, recollapse, recollapse_time)

    return ExpansionHistory(
        age_gyr=age_gyr,
        scale_factor=a_t,
        time_gyr=t_s / K.GYR,
        hubble=hubble,
        will_recollapse=recollapse,
        recollapse_time_gyr=recollapse_time,
        fate=fate,
        growth_factor=growth,
        omega_total=float(omega_total),
    )


def _fate_and_growth(
    omega_total: float,
    ec: EffectiveConstants,
    recollapse: bool,
    recollapse_time: float | None,
) -> tuple[str, float]:
    """Qualitative cosmic fate and a relative linear-growth amplitude.

    Structure growth is suppressed by strong dark energy (it freezes growth) and
    enhanced by matter density. We capture this with an approximate growth
    amplitude normalized so the baseline universe ~ 1.0.
    """
    de_ratio = ec.omega_lambda / max(ec.omega_m, 1e-6)
    # Growth saturates when matter dominates, suppressed when Lambda dominates.
    growth = ec.omega_m / (ec.omega_m + 0.7 * ec.omega_lambda)
    growth *= 1.0 / (1.0 + 0.15 * de_ratio)
    # normalize to baseline (~0.31 matter, ~0.685 lambda) -> ~0.30 raw
    growth_norm = growth / 0.30

    if recollapse and recollapse_time is not None and recollapse_time < 2.0:
        return "Big Crunch (rapid recollapse before structure forms)", growth_norm * 0.1
    if recollapse:
        return "Big Crunch (eventual recollapse)", growth_norm
    if ec.omega_lambda > 30.0 * K.OMEGA_LAMBDA:
        return "Big Rip / runaway expansion (structure torn apart)", growth_norm * 0.05
    if de_ratio > 5.0:
        return "Cold, empty de Sitter expansion (structure frozen early)", growth_norm * 0.4
    return "Open eternal expansion with structure formation", growth_norm


def critical_density(ec: EffectiveConstants) -> float:
    """Present critical density rho_c = 3 H^2 / (8 pi G) [kg/m^3]."""
    g_scale = np.sqrt(ec.G / K.G_NEWTON)
    H0 = ec.H0 * g_scale
    return 3.0 * H0 ** 2 / (8.0 * np.pi * ec.G)


__all__ = ["ExpansionHistory", "expansion_history", "critical_density"]
