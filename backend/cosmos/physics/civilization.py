"""
Civilization emergence and trajectory.

Given a life-bearing universe, we run a light agent-style model of how
intelligence and technological civilizations arise, expand, and face extinction
risks. The model is stochastic (seeded for reproducibility) and produces a
population/technology trajectory plus an outcome classification.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import math

import numpy as np

from .life import LifeResult


@dataclass
class CivilizationResult:
    intelligence_emerges: bool
    civilizations_emerge: bool
    n_civilizations_estimate: float
    peak_tech_level: float          # 0..10 Kardashev-flavoured scale
    first_civ_gyr: float
    timeline_years: list[float] = field(default_factory=list)
    population: list[float] = field(default_factory=list)
    tech: list[float] = field(default_factory=list)
    expansion: list[float] = field(default_factory=list)  # colonized fraction
    extinction_events: list[dict] = field(default_factory=list)
    outcome: str = ""
    note: str = ""


# Time needed (Gyr) after complex life for intelligence/technology.
_T_INTELLIGENCE = 0.5


def simulate_civilization(
    life: LifeResult,
    time_available_gyr: float,
    seed: int = 0,
) -> CivilizationResult:
    if not life.emerges or life.biological_complexity < 0.1:
        return CivilizationResult(
            intelligence_emerges=False, civilizations_emerge=False,
            n_civilizations_estimate=0.0, peak_tech_level=0.0,
            first_civ_gyr=float("nan"),
            outcome="No complex life -> no civilizations.",
            note="Insufficient biological complexity for intelligence.",
        )

    rng = np.random.default_rng(seed)

    # Probability intelligence arises grows with complexity and remaining time.
    p_intel = life.biological_complexity * (1 - math.exp(-time_available_gyr / 5.0))
    intelligence = p_intel > 0.15

    if not intelligence:
        return CivilizationResult(
            intelligence_emerges=False, civilizations_emerge=False,
            n_civilizations_estimate=0.0, peak_tech_level=0.0,
            first_civ_gyr=float("nan"),
            outcome="Complex life persisted but never became intelligent.",
            note=f"Intelligence probability {p_intel:.2f} too low.",
        )

    first_civ = float(life.first_life_gyr + _T_COMPLEX_LAG(time_available_gyr))
    n_civ = max(1.0, p_intel * 50.0 * life.probability)

    # Logistic technology growth with stochastic extinction events.
    years = np.linspace(0, 1e6, 200)  # 1 Myr of civ history, fine resolution
    tech = np.zeros_like(years)
    pop = np.zeros_like(years)
    expansion = np.zeros_like(years)
    extinctions: list[dict] = []

    k_tech = 10.0
    r = 8.0 / 1e6
    t0 = 2e5
    survived = True
    setback = 0.0
    for i, t in enumerate(years):
        base = k_tech / (1 + math.exp(-r * (t - t0)))
        tech[i] = max(0.0, base - setback)
        pop[i] = 1e6 * (1 + tech[i]) ** 2
        expansion[i] = min(1.0, max(0.0, (tech[i] - 4.0) / 6.0))
        # Extinction hazard rises with technology (great-filter style).
        hazard = 0.002 * (1 + tech[i])
        if survived and rng.random() < hazard:
            sev = rng.uniform(0.3, 1.0)
            extinctions.append({
                "year": float(t),
                "severity": float(sev),
                "tech_level": float(tech[i]),
                "cause": _extinction_cause(rng, tech[i]),
            })
            if sev > 0.9:
                survived = False
            else:
                setback += sev * tech[i] * 0.5

    if not survived:
        cutoff = int(np.argmax(tech == tech.max())) if tech.max() > 0 else len(tech)
        tech[cutoff:] = 0.0
        pop[cutoff:] = 0.0
        expansion[cutoff:] = expansion[cutoff] if cutoff < len(expansion) else 0.0

    peak_tech = float(tech.max())
    if peak_tech >= 7:
        outcome = "Spacefaring civilization (multi-system / Kardashev II-class)."
    elif peak_tech >= 4:
        outcome = "Planetary technological civilization."
    elif peak_tech >= 1:
        outcome = "Pre-industrial intelligence."
    else:
        outcome = "Intelligence arose but never industrialized."

    if not survived:
        outcome += " Ended by an extinction-level event."

    return CivilizationResult(
        intelligence_emerges=True,
        civilizations_emerge=peak_tech >= 1,
        n_civilizations_estimate=float(n_civ),
        peak_tech_level=peak_tech,
        first_civ_gyr=first_civ,
        timeline_years=years.tolist(),
        population=pop.tolist(),
        tech=tech.tolist(),
        expansion=expansion.tolist(),
        extinction_events=extinctions,
        outcome=outcome,
        note=f"~{n_civ:.0f} civilizations expected; peak tech {peak_tech:.1f}/10.",
    )


def _T_COMPLEX_LAG(time_available_gyr: float) -> float:
    # Time from first life to first civilization (~4 Gyr on Earth), compressed
    # if less time is available.
    return min(4.0, time_available_gyr * 0.6)


def _extinction_cause(rng: np.random.Generator, tech: float) -> str:
    natural = ["asteroid impact", "supervolcano", "nearby supernova", "gamma-ray burst", "climate collapse"]
    artificial = ["nuclear war", "engineered pathogen", "runaway AI", "ecological overshoot", "resource exhaustion"]
    pool = natural if tech < 4 else (artificial if rng.random() < 0.6 else natural)
    return str(rng.choice(pool))


__all__ = ["CivilizationResult", "simulate_civilization"]
