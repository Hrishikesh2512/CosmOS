"""Tests for the AI Scientist and What-If engine."""

import pytest

from genesis import simulate, UniverseParameters, MatterDensity, baseline
from genesis.ai.scientist import AIScientist
from genesis.ai.whatif import compare, parse_what_if, _build_comparison


def _result(**kw):
    return simulate(UniverseParameters(**kw))


# --- AI Scientist diagnoses ---------------------------------------------
def test_why_no_life_on_dead_universe():
    ai = AIScientist(_result(dimensions=4))
    d = ai.ask("Why did life fail to emerge?")
    assert d.root_causes and d.suggestions
    assert d.confidence > 0


def test_why_no_galaxies_high_dark_energy():
    ai = AIScientist(_result(dark_energy_strength=50, name="DE"))
    d = ai.ask("Why did galaxies collapse?")
    assert "galax" in d.question.lower()
    assert len(d.suggestions) > 0


def test_why_no_galaxies_4d():
    ai = AIScientist(_result(dimensions=5))
    d = ai.why_no_galaxies()
    assert any("5D" in c or "dimension" in c.lower() for c in d.root_causes)


def test_why_no_stars():
    ai = AIScientist(_result(dimensions=4))
    d = ai.why_no_stars()
    assert d.suggestions


def test_how_to_make_life_friendly_flags_bad_params():
    ai = AIScientist(_result(dimensions=4, G_mult=50, alpha_mult=3))
    d = ai.ask("How can I create a life-friendly universe?")
    assert len(d.suggestions) >= 5
    assert any("4D" in n for n in d.root_causes)


def test_summarize_on_life_bearing():
    ai = AIScientist(simulate(baseline()))
    d = ai.ask("summarize what happened")
    assert "Habitability" in d.answer


def test_civilization_question():
    ai = AIScientist(simulate(baseline()))
    d = ai.ask("what happened to the civilizations?")
    assert d.answer


def test_civilization_question_no_life():
    ai = AIScientist(_result(dimensions=4))
    d = ai.why_civilization_outcome()
    # falls back to no-life diagnosis
    assert d.suggestions


def test_default_question_routes_to_summary():
    ai = AIScientist(simulate(baseline()))
    d = ai.ask("tell me something interesting")
    assert d.answer


# --- What-If parsing -----------------------------------------------------
@pytest.mark.parametrize("prompt,attr,check", [
    ("what if gravity was 100x stronger", "G_mult", lambda v: v == 100),
    ("what if the speed of light was 10x slower", "c_mult", lambda v: v < 1),
    ("what if space had 4 dimensions", "dimensions", lambda v: v == 4),
    ("what if dark matter did not exist", "dark_matter_fraction", lambda v: v == 0.0),
    ("what if the fine structure constant was 2x larger", "alpha_mult", lambda v: v == 2),
    ("what if planck constant was 3x stronger", "h_mult", lambda v: v == 3),
])
def test_parse_what_if(prompt, attr, check):
    p = parse_what_if(prompt)
    assert check(getattr(p, attr))


def test_dark_energy_parse():
    p = parse_what_if("what if dark energy was 20x stronger")
    assert p.dark_energy_strength == 20


def test_compare_detects_lost_milestones():
    cmp = compare(UniverseParameters(name="strongG", G_mult=200))
    assert cmp.habitability_delta < 0
    assert any(d["change"] == "lost" for d in cmp.milestone_diffs)
    assert "habitability" in cmp.narrative.lower()


def test_compare_identical_has_no_diffs():
    cmp = compare(baseline(), baseline())
    assert cmp.milestone_diffs == []


def test_compare_gained_milestones():
    # A near-empty baseline vs a moderate candidate should gain milestones.
    poor = UniverseParameters(name="poor", matter_density=MatterDensity.NEAR_EMPTY,
                              dark_matter_fraction=0.0)
    cmp = compare(baseline(), poor)  # baseline as candidate vs poor base
    assert any(d["change"] == "gained" for d in cmp.milestone_diffs)
