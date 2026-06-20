"""Universe scorecard: the pass/fail milestone summary and final verdict."""

from __future__ import annotations

from dataclasses import dataclass, field
import itertools

# Monotonic counter for human-friendly universe numbering within a process.
_counter = itertools.count(1)


@dataclass
class Scorecard:
    universe_id: str
    number: int
    stars: bool
    galaxies: bool
    planets: bool
    chemistry: bool
    life: bool
    intelligence: bool
    civilizations: bool
    outcome: str
    habitability_index: float       # 0..1 composite score
    highlights: list[str] = field(default_factory=list)


def build_scorecard(exp, bbn, struct, sprof, pl, chem, lf, civ) -> Scorecard:
    number = next(_counter)
    uid = f"universe-{number:06d}"

    stars_ok = sprof.stars_possible
    galaxies_ok = struct.galaxies_form
    planets_ok = pl.rocky_worlds
    chem_ok = chem.complexity_score > 0.2
    life_ok = lf.emerges
    intel_ok = civ.intelligence_emerges
    civ_ok = civ.civilizations_emerge

    # Composite habitability index, weighted toward the rarer milestones.
    weights = {
        "expansion": (0.10, not exp.will_recollapse or (exp.recollapse_time_gyr or 0) > 5),
        "nucleo": (0.10, bbn.viable),
        "galaxies": (0.12, galaxies_ok),
        "stars": (0.15, stars_ok),
        "planets": (0.13, planets_ok),
        "chemistry": (0.15, chem_ok),
        "life": (0.15, life_ok),
        "civ": (0.10, civ_ok),
    }
    habitability = sum(w for w, ok in weights.values() if ok)

    if civ_ok:
        outcome = "Civilization-bearing universe."
    elif life_ok:
        outcome = "Life-bearing universe."
    elif chem_ok and planets_ok:
        outcome = "Habitable-chemistry universe (no life detected)."
    elif stars_ok:
        outcome = "Star-and-galaxy universe (sterile)."
    elif galaxies_ok:
        outcome = "Structure-only universe (no stars)."
    else:
        outcome = "Barren universe."

    highlights = _highlights(exp, struct, sprof, pl, chem, lf, civ)

    return Scorecard(
        universe_id=uid, number=number,
        stars=stars_ok, galaxies=galaxies_ok, planets=planets_ok,
        chemistry=chem_ok, life=life_ok, intelligence=intel_ok,
        civilizations=civ_ok, outcome=outcome,
        habitability_index=round(float(habitability), 3),
        highlights=highlights,
    )


def _highlights(exp, struct, sprof, pl, chem, lf, civ) -> list[str]:
    h = []
    if sprof.stars_possible:
        h.append(f"Stable star masses: {sprof.min_star_mass_sun:.2f}-{sprof.max_star_mass_sun:.0f} M_sun.")
    if chem.stable_elements:
        h.append(f"{chem.stable_elements} stable elements accessible.")
    if lf.emerges:
        h.append(f"Life probability {lf.probability:.0%}, {lf.time_available_gyr:.1f} Gyr to evolve.")
    if civ.civilizations_emerge:
        h.append(f"~{civ.n_civilizations_estimate:.0f} civilizations; peak tech {civ.peak_tech_level:.1f}/10.")
    if exp.will_recollapse:
        h.append("Universe recollapses in a Big Crunch.")
    return h


__all__ = ["Scorecard", "build_scorecard"]
