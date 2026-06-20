"""
Life emergence.

We estimate the probability that life arises and reaches biological complexity,
conditioned on the upstream physics: stable habitable planets, rich chemistry,
liquid water, and -- crucially -- *time*. Life needs stars that live long
enough for chemical evolution (billions of years), and a universe that itself
persists that long. This is a mechanistic, Drake-equation-flavoured model, not
a claim of certainty; it produces a relative, reproducible probability score.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

from .parameters import EffectiveConstants
from .chemistry import ChemistryResult
from .planets import PlanetResult
from .stars import StellarProfile
from .cosmology import ExpansionHistory


@dataclass
class LifeResult:
    probability: float              # 0..1 probability life emerges somewhere
    biological_complexity: float    # 0..1 how complex life can get
    emerges: bool
    time_available_gyr: float       # usable window for biogenesis + evolution
    first_life_gyr: float           # estimated cosmic time of first life
    note: str


# Time (Gyr) of relatively stable conditions needed before life and then before
# complex (multicellular-grade) life.
_T_BIOGENESIS = 0.5
_T_COMPLEX = 3.5


def evaluate_life(
    ec: EffectiveConstants,
    chem: ChemistryResult,
    planets: PlanetResult,
    stars: StellarProfile,
    exp: ExpansionHistory,
    structure_first_galaxy_gyr: float,
) -> LifeResult:
    # Hard gates
    if not (chem.carbon_chemistry and chem.water_stable and planets.rocky_worlds):
        return LifeResult(
            probability=0.0, biological_complexity=0.0, emerges=False,
            time_available_gyr=0.0, first_life_gyr=float("nan"),
            note="Missing prerequisites: needs carbon chemistry, water and rocky worlds.",
        )

    # Time window: from when planets exist (after first galaxies + a few Gyr of
    # enrichment) until either the host star dies or the universe ends.
    planet_ready = (structure_first_galaxy_gyr if structure_first_galaxy_gyr == structure_first_galaxy_gyr else 2.0) + 1.0
    star_death = stars.longest_lifetime_gyr if stars.longest_lifetime_gyr > 0 else stars.typical_lifetime_gyr
    universe_end = exp.recollapse_time_gyr if exp.will_recollapse and exp.recollapse_time_gyr else 1e4
    window_end = min(star_death, universe_end)
    time_available = max(0.0, window_end - planet_ready)

    if time_available < _T_BIOGENESIS:
        return LifeResult(
            probability=0.0, biological_complexity=0.0, emerges=False,
            time_available_gyr=float(time_available), first_life_gyr=float("nan"),
            note=(
                "Stars or the universe die before life can arise "
                f"(only {time_available:.2f} Gyr available)."
            ),
        )

    # Probability builds with chemistry richness, habitable real estate, and the
    # logarithm of available time (more time, more shots at abiogenesis).
    hab = planets.n_habitable_per_star
    p_chem = chem.complexity_score
    p_time = 1.0 - math.exp(-time_available / 2.0)
    p_real_estate = 1.0 - math.exp(-3.0 * hab * max(0.1, structure_first_galaxy_gyr * 0))  # placeholder removed below
    p_real_estate = 1.0 - math.exp(-3.0 * max(hab, 0.0))

    probability = p_chem * p_time * p_real_estate
    probability = float(max(0.0, min(1.0, probability)))

    # Biological complexity needs the longer window for evolution.
    if time_available >= _T_COMPLEX:
        complexity = probability * (1.0 - math.exp(-(time_available - _T_COMPLEX) / 3.0))
    else:
        complexity = probability * 0.1
    complexity = float(max(0.0, min(1.0, complexity)))

    emerges = probability > 0.05
    first_life = planet_ready + _T_BIOGENESIS if emerges else float("nan")

    if emerges:
        note = f"Life can emerge ~{first_life:.1f} Gyr in, with {time_available:.1f} Gyr to evolve."
    else:
        note = "Conditions allow chemistry but biogenesis probability is negligible."

    return LifeResult(
        probability=probability,
        biological_complexity=complexity,
        emerges=bool(emerges),
        time_available_gyr=float(time_available),
        first_life_gyr=float(first_life),
        note=note,
    )


__all__ = ["LifeResult", "evaluate_life"]
