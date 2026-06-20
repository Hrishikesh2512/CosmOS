"""Cosmic timeline construction from stage outputs."""

from __future__ import annotations

from dataclasses import dataclass
import math


@dataclass
class TimelineEvent:
    time_years: float
    time_label: str
    title: str
    description: str
    stage: int


def _label(gyr: float) -> str:
    if gyr != gyr:  # NaN
        return "-"
    yr = gyr * 1e9
    if yr < 1:
        return f"{yr * 1e9:.0f} yr"
    if yr < 1e6:
        return f"{yr:,.0f} years"
    if yr < 1e9:
        return f"{yr / 1e6:.0f} million years"
    return f"{yr / 1e9:.2f} billion years"


def build_timeline(exp, struct, sprof, pl, lf, civ) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []

    events.append(TimelineEvent(0.0, "0 years", "Big Bang",
                                f"Space, time and energy emerge. {exp.fate}", 1))

    events.append(TimelineEvent(3.8e5, "380,000 years", "Recombination",
                                "Atoms form; the universe becomes transparent.", 2))

    if struct.galaxies_form and struct.first_galaxy_gyr == struct.first_galaxy_gyr:
        t = struct.first_galaxy_gyr
        events.append(TimelineEvent(t * 1e9, _label(t), "First galaxies mature",
                                    struct.note, 3))

    if sprof.stars_possible:
        first_star = (struct.first_galaxy_gyr * 0.3) if struct.galaxies_form else 0.3
        events.append(TimelineEvent(first_star * 1e9, _label(first_star), "First stars ignite",
                                    f"Stars of {sprof.min_star_mass_sun:.2f}-{sprof.max_star_mass_sun:.0f} M_sun light up.", 4))
        if sprof.supernova_capable:
            sn = first_star + min(0.1, sprof.typical_lifetime_gyr)
            events.append(TimelineEvent(sn * 1e9, _label(sn), "First supernovae",
                                        "Massive stars explode, seeding heavy elements.", 4))

    if pl.rocky_worlds and struct.galaxies_form:
        t = (struct.first_galaxy_gyr if struct.first_galaxy_gyr == struct.first_galaxy_gyr else 2.0) + 1.0
        events.append(TimelineEvent(t * 1e9, _label(t), "Rocky planets form",
                                    pl.note, 5))

    if lf.emerges and lf.first_life_gyr == lf.first_life_gyr:
        events.append(TimelineEvent(lf.first_life_gyr * 1e9, _label(lf.first_life_gyr),
                                    "Life emerges", lf.note, 7))

    if civ.civilizations_emerge and civ.first_civ_gyr == civ.first_civ_gyr:
        events.append(TimelineEvent(civ.first_civ_gyr * 1e9, _label(civ.first_civ_gyr),
                                    "Civilizations emerge", civ.outcome, 8))

    if exp.will_recollapse and exp.recollapse_time_gyr:
        events.append(TimelineEvent(exp.recollapse_time_gyr * 1e9, _label(exp.recollapse_time_gyr),
                                    "Big Crunch", "The universe recollapses to a singularity.", 1))

    events.sort(key=lambda e: e.time_years)
    return events


__all__ = ["TimelineEvent", "build_timeline"]
