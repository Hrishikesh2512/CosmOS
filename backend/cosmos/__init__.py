"""
CosmOS -- a universe creation and evolution simulator.

Modify the fundamental laws of reality and watch entire universes emerge, from
the Big Bang through chemistry, life and civilization.
"""

from .physics.parameters import UniverseParameters, MatterDensity, baseline
from .engine.simulator import simulate, Simulator, SimulationResult
from .ai.scientist import AIScientist
from .ai.whatif import compare, parse_what_if

__version__ = "1.0.0"

__all__ = [
    "UniverseParameters",
    "MatterDensity",
    "baseline",
    "simulate",
    "Simulator",
    "SimulationResult",
    "AIScientist",
    "compare",
    "parse_what_if",
    "__version__",
]
