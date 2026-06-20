"""Pydantic request/response models for the Genesis API."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field

from ..physics.parameters import MatterDensity


class ParametersIn(BaseModel):
    c_mult: float = Field(1.0, gt=0, description="Speed of light multiplier")
    G_mult: float = Field(1.0, gt=0, description="Gravitational constant multiplier")
    h_mult: float = Field(1.0, gt=0, description="Planck constant multiplier")
    e_mult: float = Field(1.0, gt=0, description="Elementary charge multiplier")
    alpha_mult: float = Field(1.0, gt=0, description="Fine-structure constant multiplier")
    dimensions: int = Field(3, ge=1, le=5, description="Number of spatial dimensions")
    matter_density: MatterDensity = MatterDensity.MODERATE
    dark_matter_fraction: float = Field(0.84, ge=0, le=0.95)
    dark_energy_strength: float = Field(1.0, ge=0, le=100)
    baryonic_fraction: Optional[float] = Field(None, gt=0, le=1)
    name: str = "Untitled Universe"
    seed: int = 0


class SimulateResponse(BaseModel):
    result: dict[str, Any]


class WhatIfRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Natural-language what-if prompt")
    parameters: Optional[ParametersIn] = None
    baseline: Optional[ParametersIn] = None


class AskRequest(BaseModel):
    question: str
    result: dict[str, Any]


class SaveRequest(BaseModel):
    parameters: ParametersIn
    result: Optional[dict[str, Any]] = None
    universe_id: Optional[str] = None
