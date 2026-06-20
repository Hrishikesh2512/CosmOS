"""
The Genesis AI Scientist.

A rule-and-evidence reasoning engine that inspects a completed simulation and
answers natural-language questions about *why* a universe turned out the way it
did, and *how* to change it. It does not require an external LLM: it reasons
over the structured stage outputs using a causal model of the physics, so it is
deterministic, explainable, and always grounded in the actual simulation.

If an Anthropic API key is configured, :func:`ask_llm` can optionally enrich the
analysis with natural-language phrasing, but the analytical core stands alone.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
import re

from ..engine.simulator import SimulationResult


@dataclass
class Diagnosis:
    question: str
    answer: str
    root_causes: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    confidence: float = 0.0


def _stage(result: SimulationResult, name: str) -> dict[str, Any]:
    for s in result.stages:
        if s.name == name:
            return {"success": s.success, "summary": s.summary, **s.data}
    return {}


class AIScientist:
    """Analyzes a SimulationResult and answers questions about it."""

    def __init__(self, result: SimulationResult):
        self.r = result
        self.sc = result.scorecard
        self.params = result.parameters

    # -- public entry points ---------------------------------------------
    def ask(self, question: str) -> Diagnosis:
        q = question.lower().strip()
        if re.search(r"life.*(fail|not|didn'?t|no)", q) or ("why" in q and "life" in q and not self.sc.life):
            return self.why_no_life()
        if "life" in q and ("how" in q or "friendly" in q or "create" in q):
            return self.how_to_make_life_friendly()
        if re.search(r"galax.*(collaps|fail|no|didn'?t)", q) or ("galax" in q and not self.sc.galaxies):
            return self.why_no_galaxies()
        if "star" in q and not self.sc.stars:
            return self.why_no_stars()
        if "civiliz" in q or "intelligen" in q:
            return self.why_civilization_outcome()
        if "summar" in q or "what happened" in q or "explain" in q:
            return self.summarize()
        # default: full diagnosis
        return self.summarize()

    # -- specific diagnoses ----------------------------------------------
    def why_no_life(self) -> Diagnosis:
        causes: list[str] = []
        sugg: list[str] = []
        chem = _stage(self.r, "Chemistry")
        planet = _stage(self.r, "Planet Formation")
        star = _stage(self.r, "Star Formation")
        struct = _stage(self.r, "Structure Formation")
        lifest = _stage(self.r, "Life Emergence")
        big = _stage(self.r, "Big Bang")

        if not self.sc.stars:
            causes.append("No stars formed, so there was no energy source or heavy-element factory.")
            sugg.append("Reduce gravity (G) toward baseline and keep 3 spatial dimensions so stable stars can ignite.")
        if not self.sc.galaxies:
            causes.append("Structure never assembled, leaving matter too diffuse to make stars.")
            sugg.append("Increase dark matter fraction and matter density to seed gravitational collapse.")
        if not planet.get("rocky_worlds", False):
            causes.append("No rocky planets: " + planet.get("note", "insufficient heavy elements."))
            sugg.append("Ensure supernova-capable stars (allow massive stars) to seed metals.")
        if chem and not chem.get("carbon_chemistry", False):
            causes.append("Carbon/organic chemistry was unavailable: " + chem.get("note", ""))
            sugg.append("Keep the fine-structure constant (alpha) within ~25% of baseline for stable bonds.")
        if lifest and lifest.get("time_available_gyr", 0) < 1:
            causes.append("Too little time: stars or the universe ended before biogenesis.")
            if big.get("will_recollapse"):
                sugg.append("Lower matter density or raise dark-energy strength slightly to avoid an early Big Crunch.")
            sugg.append("Reduce G so stars live longer (lifetime scales ~1/G).")

        if not causes:
            causes.append("Prerequisites were marginal; biogenesis probability stayed below threshold.")
            sugg.append("Tune toward baseline constants and a moderate, dark-matter-rich, 3D universe.")

        answer = (
            "Life did not emerge because the causal chain broke before biology was possible. "
            + " ".join(causes)
        )
        return Diagnosis(
            question="Why did life fail to emerge?",
            answer=answer, root_causes=causes, suggestions=_dedup(sugg),
            confidence=0.85,
        )

    def why_no_galaxies(self) -> Diagnosis:
        struct = _stage(self.r, "Structure Formation")
        big = _stage(self.r, "Big Bang")
        causes, sugg = [], []
        dims = self.params["dimensions"]
        if dims != 3:
            causes.append(f"In {dims}D space, stable bound gravitational structures cannot form.")
            sugg.append("Set spatial dimensions to 3.")
        if big.get("will_recollapse") and (big.get("recollapse_time_gyr") or 99) < 2:
            causes.append("The universe recollapsed before structure could grow.")
            sugg.append("Lower matter density to avoid premature recollapse.")
        if self.params["dark_energy_strength"] > 10:
            causes.append("Dark energy was so strong it tore matter apart before it could cluster.")
            sugg.append("Reduce dark-energy strength below ~5x.")
        if struct.get("dark_matter_scaffold", 1) < 0.4:
            causes.append("Too little dark matter: baryonic perturbations were washed out, slowing collapse.")
            sugg.append("Increase the dark-matter fraction (e.g. 0.7-0.85).")
        if not causes:
            causes.append("Matter density was too low for gravity to overcome expansion.")
            sugg.append("Increase initial matter density.")
        return Diagnosis(
            "Why did galaxies fail to form?",
            "Galaxies require gravity to win over expansion within a stable 3D geometry. " + " ".join(causes),
            causes, _dedup(sugg), 0.85,
        )

    def why_no_stars(self) -> Diagnosis:
        star = _stage(self.r, "Star Formation")
        causes, sugg = [], []
        dims = self.params["dimensions"]
        if dims != 3:
            causes.append(f"{dims}D gravity has no stable hydrostatic equilibrium, so stars cannot hold together.")
            sugg.append("Use 3 spatial dimensions.")
        if star.get("mass_window_width", 1) <= 0.01:
            causes.append("The stable stellar mass window collapsed under the chosen constants.")
            sugg.append("Move G, hbar and c multipliers back toward 1 to restore the Chandrasekhar balance.")
        if not self.sc.galaxies:
            causes.append("No gas structures existed to collapse into stars.")
            sugg.append("First fix structure formation (more matter / dark matter).")
        if not causes:
            causes.append("Star formation was suppressed by the upstream conditions.")
        return Diagnosis(
            "Why did stars fail to form?",
            "Stars need a stable mass window and collapsing gas. " + " ".join(causes),
            causes, _dedup(sugg), 0.8,
        )

    def why_civilization_outcome(self) -> Diagnosis:
        civ = _stage(self.r, "Civilization Emergence")
        events = civ.get("extinction_events", []) or []
        causes = []
        if self.sc.civilizations:
            causes.append(civ.get("outcome", ""))
            if events:
                worst = max(events, key=lambda e: e.get("severity", 0))
                causes.append(f"Most severe extinction risk: {worst.get('cause')} (severity {worst.get('severity', 0):.2f}).")
        elif self.sc.life:
            causes.append("Life existed but never crossed the intelligence threshold (too little time or complexity).")
        else:
            return self.why_no_life()
        return Diagnosis(
            "What happened to civilizations?",
            "Civilization trajectory: " + " ".join(c for c in causes if c),
            causes, [], 0.75,
        )

    def how_to_make_life_friendly(self) -> Diagnosis:
        sugg = [
            "Spatial dimensions = 3 (the only setting with both stable orbits and stable atoms).",
            "Keep G within ~0.5-2x baseline: too strong shortens stellar lifetimes and shrinks the mass window.",
            "Keep the fine-structure constant alpha within ~25% of baseline for stable chemistry and bonds.",
            "Use a moderate-to-dense matter density with a high dark-matter fraction (~0.8) to build galaxies quickly.",
            "Keep dark-energy strength near 1x so structure has time to form but the universe doesn't recollapse.",
            "Allow massive stars (supernovae) so heavy elements seed rocky, water-bearing planets.",
        ]
        # Tailor: point out which current parameters are off.
        notes = []
        p = self.params
        if p["dimensions"] != 3:
            notes.append(f"Currently {p['dimensions']}D - this alone prevents life.")
        if not 0.5 <= p["G_mult"] <= 2:
            notes.append(f"G is {p['G_mult']}x baseline.")
        if not 0.75 <= p["alpha_mult"] <= 1.25:
            notes.append(f"alpha is {p['alpha_mult']}x baseline.")
        answer = "To build a life-friendly universe, aim for conditions like our own where the causal chain stays intact:"
        if notes:
            answer += " Your current settings to revisit: " + "; ".join(notes)
        return Diagnosis(
            "How can I create a life-friendly universe?",
            answer, root_causes=notes, suggestions=sugg, confidence=0.9,
        )

    def summarize(self) -> Diagnosis:
        sc = self.sc
        milestones = [
            ("galaxies", sc.galaxies), ("stars", sc.stars), ("planets", sc.planets),
            ("chemistry", sc.chemistry), ("life", sc.life),
            ("intelligence", sc.intelligence), ("civilizations", sc.civilizations),
        ]
        achieved = [m for m, ok in milestones if ok]
        failed_at = next((m for m, ok in milestones if not ok), None)
        ans = f"{sc.outcome} Habitability index {sc.habitability_index:.2f}. "
        if achieved:
            ans += "Achieved: " + ", ".join(achieved) + ". "
        if failed_at:
            ans += f"The chain first broke at: {failed_at}."
        return Diagnosis(
            "Summary", ans, root_causes=sc.highlights,
            suggestions=[], confidence=0.95,
        )


def _dedup(items: list[str]) -> list[str]:
    seen, out = set(), []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


__all__ = ["AIScientist", "Diagnosis"]
