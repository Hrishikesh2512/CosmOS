"""Unit and integration tests for the simulation engine."""

import json
import math

import pytest

from genesis import simulate, UniverseParameters, MatterDensity, baseline
from genesis.engine.simulator import _clean


def test_baseline_is_life_bearing():
    r = simulate(baseline())
    sc = r.scorecard
    assert sc.stars and sc.galaxies and sc.planets
    assert sc.chemistry and sc.life
    assert sc.habitability_index > 0.7


def test_four_dimensions_is_barren():
    r = simulate(UniverseParameters(name="4D", dimensions=4))
    sc = r.scorecard
    assert not sc.stars and not sc.galaxies and not sc.life
    assert "Barren" in sc.outcome


def test_strong_gravity_is_sterile():
    r = simulate(UniverseParameters(name="100G", G_mult=100))
    assert not r.scorecard.life
    # stars may form but burn out fast
    assert r.stages[3].data["typical_lifetime_gyr"] < 1.0


def test_no_dark_matter_suppresses_structure():
    r_with = simulate(UniverseParameters(dark_matter_fraction=0.84))
    r_without = simulate(UniverseParameters(dark_matter_fraction=0.0))
    s_with = r_with.stages[2].data["structure_richness"]
    s_without = r_without.stages[2].data["structure_richness"]
    assert s_without < s_with


def test_all_eight_stages_present():
    r = simulate(baseline())
    assert len(r.stages) == 8
    names = [s.name for s in r.stages]
    assert names == [
        "Big Bang", "Particle Formation", "Structure Formation",
        "Star Formation", "Planet Formation", "Chemistry",
        "Life Emergence", "Civilization Emergence",
    ]


def test_timeline_is_ordered():
    r = simulate(baseline())
    times = [e.time_years for e in r.timeline]
    assert times == sorted(times)
    assert r.timeline[0].title == "Big Bang"


def test_result_is_json_serializable():
    r = simulate(baseline())
    payload = json.dumps(r.to_dict())
    assert "scorecard" in payload
    # No NaN/Inf leaked into JSON
    assert "NaN" not in payload and "Infinity" not in payload


def test_deterministic_with_seed():
    p = UniverseParameters(name="seeded", seed=42)
    r1 = simulate(p)
    r2 = simulate(UniverseParameters(name="seeded", seed=42))
    assert r1.scorecard.outcome == r2.scorecard.outcome
    assert r1.stages[7].data.get("peak_tech_level") == r2.stages[7].data.get("peak_tech_level")


def test_clean_handles_nan_and_numpy():
    import numpy as np
    cleaned = _clean({"a": np.float64(1.5), "b": float("nan"), "c": np.array([1, 2])})
    assert cleaned["a"] == 1.5
    assert cleaned["b"] is None
    assert cleaned["c"] == [1, 2]


def test_visualization_payload_present():
    r = simulate(baseline())
    viz = r.visualization
    assert "universe" in viz and "galaxy" in viz
    assert "solar_system" in viz and "civilization" in viz


@pytest.mark.parametrize("d", [1, 2, 3, 4, 5])
def test_all_dimensions_run_without_error(d):
    r = simulate(UniverseParameters(dimensions=d))
    assert r.scorecard.outcome  # produces a verdict, never crashes
