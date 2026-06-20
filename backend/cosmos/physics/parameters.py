"""
Universe parameter model.

A :class:`UniverseParameters` instance fully specifies a universe. Fundamental
constants are stored as dimensionless *multipliers* relative to the baseline
values in :mod:`cosmos.physics.constants`. Cosmological knobs (dimensions,
matter density, dark matter / dark energy) are stored directly.

The class also exposes the *effective* physical constants of the universe via
:meth:`effective`, which is what the rest of the engine consumes.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any

from . import constants as K


class MatterDensity(str, Enum):
    NEAR_EMPTY = "near_empty"
    SPARSE = "sparse"
    MODERATE = "moderate"
    DENSE = "dense"
    EXTREME = "extreme"

    @property
    def omega_scale(self) -> float:
        """Multiplier on the baseline total matter density Omega_m."""
        return {
            MatterDensity.NEAR_EMPTY: 0.05,
            MatterDensity.SPARSE: 0.4,
            MatterDensity.MODERATE: 1.0,
            MatterDensity.DENSE: 3.0,
            MatterDensity.EXTREME: 12.0,
        }[self]


@dataclass
class EffectiveConstants:
    """Concrete physical constants for a given universe (SI-like units)."""

    c: float
    G: float
    h: float
    hbar: float
    e: float
    alpha: float
    epsilon_0: float
    k_B: float
    m_proton: float
    m_electron: float
    m_neutron: float
    dimensions: int

    # cosmological
    omega_m: float
    omega_b: float
    omega_dm: float
    omega_lambda: float
    omega_r: float
    H0: float

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class UniverseParameters:
    """User-facing universe definition.

    All ``*_mult`` fields are dimensionless multipliers on the baseline
    constant. ``dimensions`` is the number of *spatial* dimensions.
    """

    # Fundamental-constant multipliers
    c_mult: float = 1.0          # speed of light
    G_mult: float = 1.0          # gravitational constant
    h_mult: float = 1.0          # Planck constant
    e_mult: float = 1.0          # elementary charge
    alpha_mult: float = 1.0      # fine-structure constant

    # Cosmological structure
    dimensions: int = 3          # spatial dimensions (1..5)
    matter_density: MatterDensity = MatterDensity.MODERATE
    dark_matter_fraction: float = 0.84   # fraction of matter that is dark (0..0.9)
    dark_energy_strength: float = 1.0    # multiplier on Lambda (0..100)
    baryonic_fraction: float | None = None  # if set, overrides dark_matter_fraction

    # Metadata
    name: str = "Untitled Universe"
    seed: int = 0

    def __post_init__(self) -> None:
        self.validate()

    # -- validation -------------------------------------------------------
    def validate(self) -> None:
        if not (1 <= self.dimensions <= 5):
            raise ValueError("dimensions must be in 1..5")
        for fld in ("c_mult", "G_mult", "h_mult", "e_mult", "alpha_mult"):
            v = getattr(self, fld)
            if v <= 0:
                raise ValueError(f"{fld} must be > 0 (got {v})")
        if not (0.0 <= self.dark_matter_fraction <= 0.95):
            raise ValueError("dark_matter_fraction must be in 0..0.95")
        if not (0.0 <= self.dark_energy_strength <= 100.0):
            raise ValueError("dark_energy_strength must be in 0..100")
        if self.baryonic_fraction is not None and not (0.0 < self.baryonic_fraction <= 1.0):
            raise ValueError("baryonic_fraction must be in (0, 1]")

    # -- derived constants ------------------------------------------------
    def effective(self) -> EffectiveConstants:
        """Resolve multipliers into concrete physical constants.

        Note: the fine-structure constant alpha = e^2 / (4 pi eps0 hbar c).
        We honour ``alpha_mult`` directly by adjusting epsilon_0 so that the
        requested alpha is realized given the chosen e, h, c. This keeps the
        electromagnetic coupling self-consistent.
        """
        c = K.C_LIGHT * self.c_mult
        G = K.G_NEWTON * self.G_mult
        h = K.H_PLANCK * self.h_mult
        hbar = h / (2.0 * math.pi)
        e = K.E_CHARGE * self.e_mult
        alpha = K.ALPHA_FS * self.alpha_mult

        # alpha = e^2 / (4 pi eps0 hbar c)  =>  eps0 = e^2 / (4 pi alpha hbar c)
        epsilon_0 = e ** 2 / (4.0 * math.pi * alpha * hbar * c)

        # matter content
        if self.baryonic_fraction is not None:
            dm_frac = max(0.0, 1.0 - self.baryonic_fraction)
        else:
            dm_frac = self.dark_matter_fraction

        omega_m = K.OMEGA_M * self.matter_density.omega_scale
        omega_b = omega_m * (1.0 - dm_frac)
        omega_dm = omega_m * dm_frac
        omega_lambda = K.OMEGA_LAMBDA * self.dark_energy_strength
        omega_r = K.OMEGA_R

        return EffectiveConstants(
            c=c, G=G, h=h, hbar=hbar, e=e, alpha=alpha,
            epsilon_0=epsilon_0, k_B=K.K_BOLTZMANN,
            m_proton=K.M_PROTON, m_electron=K.M_ELECTRON, m_neutron=K.M_NEUTRON,
            dimensions=self.dimensions,
            omega_m=omega_m, omega_b=omega_b, omega_dm=omega_dm,
            omega_lambda=omega_lambda, omega_r=omega_r, H0=K.H0_SI,
        )

    # -- serialization ----------------------------------------------------
    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["matter_density"] = self.matter_density.value
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "UniverseParameters":
        data = dict(data)
        if "matter_density" in data and not isinstance(data["matter_density"], MatterDensity):
            data["matter_density"] = MatterDensity(data["matter_density"])
        allowed = cls.__dataclass_fields__.keys()
        return cls(**{k: v for k, v in data.items() if k in allowed})


def baseline() -> UniverseParameters:
    """The parameters that reproduce our universe."""
    return UniverseParameters(
        name="Baseline (Our Universe)",
        dark_matter_fraction=K.OMEGA_DM / K.OMEGA_M,
    )


__all__ = [
    "MatterDensity",
    "EffectiveConstants",
    "UniverseParameters",
    "baseline",
]
