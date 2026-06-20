"""
Large-scale structure formation.

Dark matter provides the gravitational scaffolding whose potential wells
baryons fall into; without it, structure grows far more slowly because baryonic
density perturbations are erased by radiation pressure before recombination.
We combine the linear growth amplitude from the cosmology module with the dark
matter fraction and dimensionality to estimate how much hierarchical structure
(galaxies, clusters) a universe forms, and on what timescale.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

from .parameters import EffectiveConstants
from .cosmology import ExpansionHistory
from . import dimensions as dim


@dataclass
class StructureResult:
    galaxies_form: bool
    clusters_form: bool
    structure_richness: float       # 0..1
    first_galaxy_gyr: float         # when galaxies mature
    n_galaxies_estimate: float      # relative (baseline ~ 1.0 = ~2e12 obs.)
    dark_matter_scaffold: float     # 0..1 contribution from DM
    note: str


def form_structure(ec: EffectiveConstants, exp: ExpansionHistory) -> StructureResult:
    dprof = dim.profile(ec.dimensions)

    dm_frac = ec.omega_dm / max(ec.omega_m, 1e-9)
    # DM scaffold: structure assembly is much faster with cold dark matter.
    scaffold = 0.2 + 0.8 * dm_frac  # baryon-only universes still form some structure, slowly

    # Combine linear growth, matter content, DM scaffold, dimensionality.
    richness = (
        max(0.0, min(1.5, exp.growth_factor))
        * scaffold
        * dprof.structure_factor
        * min(1.0, ec.omega_m / 0.3)
    )
    richness = float(max(0.0, min(1.0, richness)))

    galaxies = richness > 0.15 and dprof.stable_orbits
    clusters = richness > 0.35 and galaxies

    # Timing: more DM and matter -> earlier maturation. Baseline ~ 1-2 Gyr.
    if galaxies:
        first_galaxy = 1.0 / (0.3 + 0.9 * scaffold * min(1.0, ec.omega_m / 0.3))
        first_galaxy = max(0.2, min(first_galaxy, exp.age_gyr * 0.8 if exp.age_gyr > 0 else 5.0))
    else:
        first_galaxy = float("nan")

    n_gal = richness * (1.0 + 2.0 * (ec.omega_m / 0.3))

    if not dprof.stable_orbits:
        note = f"{ec.dimensions}D space cannot host bound galaxies."
    elif dm_frac < 0.05:
        note = "Negligible dark matter: structure grows slowly; galaxies sparse and late."
    elif richness < 0.15:
        note = "Expansion or low density suppressed gravitational collapse; few galaxies."
    else:
        note = "Dark-matter halos seed a rich hierarchy of galaxies and clusters."

    return StructureResult(
        galaxies_form=bool(galaxies),
        clusters_form=bool(clusters),
        structure_richness=richness,
        first_galaxy_gyr=float(first_galaxy),
        n_galaxies_estimate=float(n_gal),
        dark_matter_scaffold=float(scaffold),
        note=note,
    )


__all__ = ["StructureResult", "form_structure"]
