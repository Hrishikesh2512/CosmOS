"""
Stellar physics: the mass window for stars, lifetimes, and the Chandrasekhar
limit -- all expressed relative to fundamental constants.

Key relations (order-of-magnitude, normalized to baseline):

* Chandrasekhar mass:  M_Ch ~ (hbar c / G)^(3/2) / m_p^2.
  Stronger gravity or weaker hbar/c shrinks the maximum stellar-core mass.
* Minimum (fusion-igniting) mass scales with the gravitational binding needed
  to reach fusion temperatures: roughly M_min ~ M_Ch * (something weakly
  varying); we track it as a fraction of M_Ch.
* Main-sequence lifetime: t_MS ~ (M / L). With L ~ M^3 (mass-luminosity) and
  stronger gravity accelerating fusion, lifetimes shorten with G.

A universe is "star-bearing" only if a non-empty stable mass window exists and
typical lifetimes are long enough for downstream evolution (>~ 10 Myr; for life,
much longer).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from . import constants as K
from .parameters import EffectiveConstants
from . import dimensions as dim


@dataclass
class StellarProfile:
    chandrasekhar_mass_sun: float   # max stable degenerate core [M_sun]
    min_star_mass_sun: float        # fusion ignition floor [M_sun]
    max_star_mass_sun: float        # radiation-pressure ceiling [M_sun]
    typical_lifetime_gyr: float     # lifetime of a sun-like star [Gyr]
    longest_lifetime_gyr: float     # lifetime of smallest stable star [Gyr]
    supernova_capable: bool         # can stars go supernova & seed metals?
    stars_possible: bool
    mass_window_width: float        # max - min in M_sun (>0 required)
    note: str


def chandrasekhar_mass(ec: EffectiveConstants) -> float:
    """Chandrasekhar mass in solar masses, normalized to 1.44 at baseline.

    M_Ch ~ (hbar c / G)^(3/2) / m_p^2.
    """
    base = (K.HBAR * K.C_LIGHT / K.G_NEWTON) ** 1.5 / K.M_PROTON ** 2
    val = (ec.hbar * ec.c / ec.G) ** 1.5 / ec.m_proton ** 2
    return K.CHANDRASEKHAR_SUN * (val / base)


def stellar_profile(ec: EffectiveConstants) -> StellarProfile:
    p = dim.profile(ec.dimensions)

    m_ch = chandrasekhar_mass(ec)

    # No stable bound systems -> no stars at all.
    if not p.stable_orbits or ec.dimensions != 3:
        # In 2D stars are marginal; in 1D / >=4D impossible.
        if ec.dimensions == 2:
            note = "2D gravity permits marginal proto-stellar disks but weak fusion structure."
        else:
            note = (
                f"In {ec.dimensions}D space gravitationally bound, long-lived "
                "stars cannot form (no stable hydrostatic equilibrium)."
            )
            return StellarProfile(
                chandrasekhar_mass_sun=m_ch, min_star_mass_sun=0.0,
                max_star_mass_sun=0.0, typical_lifetime_gyr=0.0,
                longest_lifetime_gyr=0.0, supernova_capable=False,
                stars_possible=False, mass_window_width=0.0, note=note,
            )
    else:
        note = "3D gravity supports a full stellar main sequence."

    # Min fusion mass scales with M_Ch (both set by quantum-gravity balance).
    min_mass = K.STAR_MIN_MASS_SUN * (m_ch / K.CHANDRASEKHAR_SUN)
    # Upper mass limited by radiation pressure (Eddington); scales weakly with
    # M_Ch and inversely with stronger coupling. Keep ~150 at baseline.
    max_mass = K.STAR_MAX_MASS_SUN * (m_ch / K.CHANDRASEKHAR_SUN) ** 0.5

    window = max(0.0, max_mass - min_mass)
    stars_possible = window > 0.01 and min_mass < 1.0

    # Lifetime of a sun-like star: t ~ M/L, L ~ M^3 -> t ~ M^-2. Stronger G
    # raises core temperature and burn rate: t ~ 1/G roughly.
    g_scale = ec.G / K.G_NEWTON
    base_life = 10.0  # Gyr for the Sun
    typical_life = base_life / g_scale

    # smallest stable star (red dwarf) lives far longer (~ (M/M_sun)^-2.5)
    if min_mass > 0:
        longest_life = typical_life * (min_mass / 1.0) ** -2.5
    else:
        longest_life = 0.0

    supernova = max_mass >= 8.0 and stars_possible

    if ec.dimensions == 2:
        stars_possible = stars_possible and True
        typical_life *= 0.5

    if not stars_possible:
        note = "No viable stellar mass window: stars cannot ignite or are unstable."

    return StellarProfile(
        chandrasekhar_mass_sun=float(m_ch),
        min_star_mass_sun=float(min_mass),
        max_star_mass_sun=float(max_mass),
        typical_lifetime_gyr=float(typical_life),
        longest_lifetime_gyr=float(min(longest_life, 1e4)),
        supernova_capable=bool(supernova),
        stars_possible=bool(stars_possible),
        mass_window_width=float(window),
        note=note,
    )


def initial_mass_function(profile: StellarProfile, n: int = 2000,
                          seed: int = 0) -> np.ndarray:
    """Sample stellar masses from a Salpeter-like IMF within the stable window.

    dN/dM ~ M^-2.35. Returns masses in solar masses (empty if no stars).
    """
    if not profile.stars_possible:
        return np.array([])
    rng = np.random.default_rng(seed)
    lo, hi = profile.min_star_mass_sun, profile.max_star_mass_sun
    if hi <= lo:
        return np.array([])
    alpha = 2.35
    u = rng.random(n)
    lo_p = lo ** (1 - alpha)
    hi_p = hi ** (1 - alpha)
    masses = (u * (hi_p - lo_p) + lo_p) ** (1.0 / (1 - alpha))
    return masses


__all__ = [
    "StellarProfile",
    "chandrasekhar_mass",
    "stellar_profile",
    "initial_mass_function",
]
