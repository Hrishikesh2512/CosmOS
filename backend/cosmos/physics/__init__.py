"""CosmOS physics engine.

A collection of physically-motivated, parameter-driven models that turn a
:class:`~cosmos.physics.parameters.UniverseParameters` definition into a full
chain of cosmic consequences -- from the Big Bang through chemistry, life and
civilization. Each module is independently testable and normalized so that the
baseline universe reproduces our own.
"""

from . import constants
from . import dimensions
from .parameters import (
    UniverseParameters,
    EffectiveConstants,
    MatterDensity,
    baseline,
)

__all__ = [
    "constants",
    "dimensions",
    "UniverseParameters",
    "EffectiveConstants",
    "MatterDensity",
    "baseline",
]
