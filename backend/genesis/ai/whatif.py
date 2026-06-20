"""
The What-If engine.

Compares a candidate universe against a baseline, runs both simulations, and
explains the differences milestone-by-milestone. Also parses simple natural
language "what if" prompts (e.g. "what if gravity was 100x stronger") into
parameter changes.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any
import re

from ..physics.parameters import UniverseParameters, MatterDensity, baseline
from ..engine.simulator import simulate, SimulationResult


@dataclass
class Comparison:
    baseline_id: str
    candidate_id: str
    baseline_outcome: str
    candidate_outcome: str
    milestone_diffs: list[dict[str, Any]]
    habitability_delta: float
    narrative: str
    candidate: dict[str, Any]
    baseline: dict[str, Any]


_MILESTONES = ["galaxies", "stars", "planets", "chemistry", "life", "intelligence", "civilizations"]


def compare(candidate: UniverseParameters,
            base: UniverseParameters | None = None) -> Comparison:
    base = base or baseline()
    rb = simulate(base)
    rc = simulate(candidate)
    return _build_comparison(rb, rc)


def _build_comparison(rb: SimulationResult, rc: SimulationResult) -> Comparison:
    diffs = []
    for m in _MILESTONES:
        b = getattr(rb.scorecard, m)
        c = getattr(rc.scorecard, m)
        if b != c:
            diffs.append({
                "milestone": m,
                "baseline": b,
                "candidate": c,
                "change": "gained" if c and not b else "lost",
            })

    lost = [d["milestone"] for d in diffs if d["change"] == "lost"]
    gained = [d["milestone"] for d in diffs if d["change"] == "gained"]
    delta = rc.scorecard.habitability_index - rb.scorecard.habitability_index

    parts = [f"Compared to baseline ({rb.scorecard.outcome.lower()}), this universe is {rc.scorecard.outcome.lower()}"]
    if lost:
        parts.append(f"It loses: {', '.join(lost)}.")
    if gained:
        parts.append(f"It gains: {', '.join(gained)}.")
    if not diffs:
        parts.append("The high-level milestones are unchanged, though detailed dynamics differ.")
    parts.append(f"Habitability index {delta:+.2f} ({rb.scorecard.habitability_index:.2f} -> {rc.scorecard.habitability_index:.2f}).")

    return Comparison(
        baseline_id=rb.universe_id, candidate_id=rc.universe_id,
        baseline_outcome=rb.scorecard.outcome, candidate_outcome=rc.scorecard.outcome,
        milestone_diffs=diffs, habitability_delta=round(delta, 3),
        narrative=" ".join(parts),
        candidate=rc.to_dict(), baseline=rb.to_dict(),
    )


# -- natural language parsing --------------------------------------------
_FACTOR = r"(\d+(?:\.\d+)?)\s*x"


def parse_what_if(prompt: str, base: UniverseParameters | None = None) -> UniverseParameters:
    """Turn a prompt like 'what if gravity was 100x stronger' into params."""
    base = base or baseline()
    p = UniverseParameters.from_dict(base.to_dict())
    q = prompt.lower()

    def factor(default=2.0):
        m = re.search(_FACTOR, q)
        return float(m.group(1)) if m else default

    def direction():
        if any(w in q for w in ["stronger", "more", "larger", "higher", "faster", "increase"]):
            return 1
        if any(w in q for w in ["weaker", "less", "smaller", "lower", "slower", "decrease"]):
            return -1
        return 1

    f = factor()
    d = direction()
    val = f if d > 0 else 1.0 / f

    if "gravity" in q or re.search(r"\bg\b", q):
        p.G_mult = val
    if "speed of light" in q or re.search(r"\blight\b", q) or re.search(r"\bc\b", q):
        # "slower" light => smaller c
        p.c_mult = (1.0 / f) if ("slow" in q or d < 0) else f
    if "planck" in q:
        p.h_mult = val
    if "charge" in q:
        p.e_mult = val
    if "fine structure" in q or "alpha" in q:
        p.alpha_mult = val
    if "dark matter" in q:
        if "no" in q or "without" in q or "0" in q:
            p.dark_matter_fraction = 0.0
        else:
            p.dark_matter_fraction = min(0.9, p.dark_matter_fraction * (val))
    if "dark energy" in q:
        p.dark_energy_strength = min(100.0, max(0.0, f if d > 0 else 1.0 / f))
    if "dimension" in q:
        m = re.search(r"(\d)\s*d|dimension[s]?\s*(?:of|=|:)?\s*(\d)", q)
        if m:
            p.dimensions = int(next(g for g in m.groups() if g))
        elif "4" in q:
            p.dimensions = 4

    p.name = f"What-If: {prompt.strip()[:60]}"
    p.validate()
    return p


__all__ = ["Comparison", "compare", "parse_what_if"]
