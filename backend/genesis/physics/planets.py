"""
Planet formation and habitable zones.

Planets condense from the metal-enriched disks around stars. Their existence
requires (a) stable orbits (3D), (b) heavy elements from prior supernovae, and
(c) stars long-lived enough for disks to form. The habitable zone -- where a
rocky world can host liquid water -- depends on stellar luminosity and the
strength of chemical bonds (fine-structure constant), which sets the liquid
range of water.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from . import constants as K
from .parameters import EffectiveConstants
from .stars import StellarProfile
from .nucleosynthesis import BBNResult
from . import dimensions as dim


@dataclass
class PlanetResult:
    rocky_worlds: bool
    gas_giants: bool
    moons: bool
    metallicity: float              # 0..1 availability of planet-building metals
    habitable_zone_width_au: float  # radial extent of HZ around a sun-like star
    n_rocky_per_star: float         # expected rocky planets per star
    n_habitable_per_star: float     # expected HZ rocky planets per star
    note: str


def form_planets(
    ec: EffectiveConstants,
    stars: StellarProfile,
    bbn: BBNResult,
    structure_richness: float,
    supernova_seeded: bool,
) -> PlanetResult:
    dprof = dim.profile(ec.dimensions)

    if not stars.stars_possible or not dprof.stable_orbits:
        return PlanetResult(
            rocky_worlds=False, gas_giants=False, moons=False, metallicity=0.0,
            habitable_zone_width_au=0.0, n_rocky_per_star=0.0,
            n_habitable_per_star=0.0,
            note="No stable orbits or no stars: planets cannot form.",
        )

    # Metallicity: needs supernova seeding + several stellar generations.
    metallicity = 0.0
    if supernova_seeded:
        metallicity = min(1.0, 0.4 * structure_richness + 0.6 * min(1.0, structure_richness * 2))
    metallicity = float(max(bbn.metals_seed, metallicity))

    rocky = metallicity > 0.05
    gas_giants = metallicity > 0.02
    moons = rocky and dprof.stable_orbits

    # Habitable-zone width scales with sqrt(L) spread; chemistry (alpha) sets the
    # liquid-water temperature range. alpha far from 1 collapses the liquid range.
    alpha_ratio = ec.alpha / K.ALPHA_FS
    chem_band = math.exp(-((math.log(alpha_ratio)) ** 2) / (2 * 0.25 ** 2))  # peak at 1
    hz_width = 0.3 * chem_band  # AU, baseline ~ 0.3 AU around the Sun

    n_rocky = (3.0 * metallicity) if rocky else 0.0
    n_hab = n_rocky * 0.25 * chem_band

    if not rocky:
        note = "Too few heavy elements to build rocky worlds; only gas/ice possible."
    elif chem_band < 0.2:
        note = "Chemistry mistuned (alpha far from baseline): negligible liquid-water zone."
    else:
        note = "Metal-rich disks form rocky planets, gas giants and moons with viable HZs."

    return PlanetResult(
        rocky_worlds=bool(rocky),
        gas_giants=bool(gas_giants),
        moons=bool(moons),
        metallicity=metallicity,
        habitable_zone_width_au=float(hz_width),
        n_rocky_per_star=float(n_rocky),
        n_habitable_per_star=float(n_hab),
        note=note,
    )


__all__ = ["PlanetResult", "form_planets"]
