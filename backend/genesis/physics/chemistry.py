"""
Chemistry.

Chemical complexity is exquisitely sensitive to the fine-structure constant
(alpha) and the electron/proton mass ratio. alpha sets the strength of chemical
bonds and the stability of atoms:

* If alpha is too large, the electromagnetic repulsion / relativistic
  corrections destabilize heavy atoms (no periodic table beyond light elements).
* If alpha is too small, bonds are too weak for stable molecules at stellar /
  planetary temperatures.
* The famous carbon "triple-alpha" Hoyle-state resonance, which lets stars make
  carbon and oxygen, is sensitive to the nuclear-force / electromagnetic
  balance; we proxy that sensitivity with alpha too.

We also require stable atoms (3D) and the availability of hydrogen + metals.
The output is a complexity score and a count of accessible stable elements.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

from . import constants as K
from .parameters import EffectiveConstants
from .planets import PlanetResult
from .nucleosynthesis import BBNResult
from . import dimensions as dim


@dataclass
class ChemistryResult:
    stable_elements: int            # number of stable elements accessible
    complexity_score: float         # 0..1 overall chemical richness
    carbon_chemistry: bool          # organic (carbon) chemistry viable?
    water_stable: bool              # liquid water possible?
    bond_strength_factor: float     # relative to baseline
    note: str


def evaluate_chemistry(
    ec: EffectiveConstants,
    planets: PlanetResult,
    bbn: BBNResult,
) -> ChemistryResult:
    dprof = dim.profile(ec.dimensions)

    if not dprof.stable_atoms:
        return ChemistryResult(
            stable_elements=0, complexity_score=0.0, carbon_chemistry=False,
            water_stable=False, bond_strength_factor=0.0,
            note=f"{ec.dimensions}D space: no stable electron orbitals, so no atoms.",
        )

    alpha_ratio = ec.alpha / K.ALPHA_FS

    # Heaviest stable element ~ scales inversely with alpha (relativistic limit
    # Z_max ~ 1/alpha ~ 137 at baseline). Larger alpha -> fewer elements.
    z_max = 1.0 / ec.alpha
    z_max_base = 1.0 / K.ALPHA_FS  # ~137
    stable_elements = int(max(0, min(118, round(92 * z_max / z_max_base))))

    # Bond strength ~ alpha^2 (Rydberg ~ alpha^2 m_e c^2). Too weak or too
    # strong both hurt; molecular richness peaks near baseline.
    bond_strength = alpha_ratio ** 2
    chem_band = math.exp(-((math.log(alpha_ratio)) ** 2) / (2 * 0.20 ** 2))

    # 2D chemistry is topologically impoverished (no chiral knots, limited rings)
    dim_penalty = 1.0 if ec.dimensions == 3 else 0.3

    # Need hydrogen (for water/organics) and metals (for elements heavier than He)
    h_ok = bbn.hydrogen_fraction > 0.2
    metals_ok = planets.metallicity > 0.05

    carbon = (stable_elements >= 6) and chem_band > 0.3 and metals_ok and h_ok
    water = h_ok and chem_band > 0.25 and stable_elements >= 8

    complexity = chem_band * dim_penalty * min(1.0, stable_elements / 92.0)
    complexity *= (1.0 if metals_ok else 0.2) * (1.0 if h_ok else 0.3)
    complexity = float(max(0.0, min(1.0, complexity)))

    if stable_elements < 6:
        note = "Periodic table truncated: no carbon, no complex chemistry."
    elif not metals_ok:
        note = "Elements possible in principle but no metals were synthesized in stars."
    elif chem_band < 0.3:
        note = "Bond strengths mistuned (alpha off baseline): molecules unstable."
    elif carbon and water:
        note = "Rich carbon-and-water chemistry: the basis for complex molecules."
    else:
        note = "Limited but non-trivial chemistry."

    return ChemistryResult(
        stable_elements=stable_elements,
        complexity_score=complexity,
        carbon_chemistry=bool(carbon),
        water_stable=bool(water),
        bond_strength_factor=float(bond_strength),
        note=note,
    )


__all__ = ["ChemistryResult", "evaluate_chemistry"]
