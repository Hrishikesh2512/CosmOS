"""API routes for Genesis."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException

from ..physics.parameters import UniverseParameters, baseline
from ..engine.simulator import simulate, SimulationResult, StageResult, _clean
from ..engine.scorecard import Scorecard
from ..engine.timeline import TimelineEvent
from ..ai.scientist import AIScientist
from ..ai.whatif import compare, parse_what_if
from ..storage.repository import UniverseRepository
from .schemas import (
    ParametersIn, WhatIfRequest, AskRequest, SaveRequest,
)

router = APIRouter()
repo = UniverseRepository()


def _params_from(p: ParametersIn) -> UniverseParameters:
    return UniverseParameters.from_dict(p.model_dump())


def _reconstruct(result_dict: dict[str, Any]) -> SimulationResult:
    """Rebuild a SimulationResult from a serialized dict (for stateless AI calls)."""
    return SimulationResult(
        universe_id=result_dict["universe_id"],
        parameters=result_dict["parameters"],
        effective_constants=result_dict["effective_constants"],
        dimensional_profile=result_dict["dimensional_profile"],
        stages=[StageResult(**s) for s in result_dict["stages"]],
        timeline=[TimelineEvent(**e) for e in result_dict["timeline"]],
        scorecard=Scorecard(**result_dict["scorecard"]),
        visualization=result_dict["visualization"],
        compute_time_ms=result_dict["compute_time_ms"],
    )


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "genesis"}


@router.get("/baseline")
def get_baseline() -> dict[str, Any]:
    return baseline().to_dict()


@router.post("/simulate")
def post_simulate(params: ParametersIn) -> dict[str, Any]:
    try:
        up = _params_from(params)
        result = simulate(up)
        return {"result": result.to_dict()}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/whatif")
def post_whatif(req: WhatIfRequest) -> dict[str, Any]:
    base = _params_from(req.baseline) if req.baseline else baseline()
    if req.prompt:
        candidate = parse_what_if(req.prompt, base)
    elif req.parameters:
        candidate = _params_from(req.parameters)
    else:
        raise HTTPException(status_code=422, detail="Provide either prompt or parameters")
    cmp = compare(candidate, base)
    return cmp.__dict__


@router.post("/ask")
def post_ask(req: AskRequest) -> dict[str, Any]:
    try:
        result = _reconstruct(req.result)
    except (KeyError, TypeError) as e:
        raise HTTPException(status_code=422, detail=f"Invalid result payload: {e}")
    ai = AIScientist(result)
    diag = ai.ask(req.question)
    return diag.__dict__


# -- persistence ----------------------------------------------------------
@router.post("/universes")
def save_universe(req: SaveRequest) -> dict[str, Any]:
    up = _params_from(req.parameters)
    su = repo.save(up, req.result, req.universe_id)
    return su.public()


@router.get("/universes")
def list_universes() -> list[dict[str, Any]]:
    return [
        {"id": u.id, "name": u.name, "parameters": u.parameters,
         "created_at": u.created_at, "updated_at": u.updated_at,
         "outcome": (u.result or {}).get("scorecard", {}).get("outcome")}
        for u in repo.list()
    ]


@router.get("/universes/{universe_id}")
def get_universe(universe_id: str) -> dict[str, Any]:
    su = repo.get(universe_id)
    if not su:
        raise HTTPException(status_code=404, detail="Universe not found")
    return su.public()


@router.delete("/universes/{universe_id}")
def delete_universe(universe_id: str) -> dict[str, bool]:
    return {"deleted": repo.delete(universe_id)}


@router.post("/universes/{universe_id}/share")
def share_universe(universe_id: str) -> dict[str, str]:
    token = repo.make_shareable(universe_id)
    if not token:
        raise HTTPException(status_code=404, detail="Universe not found")
    return {"share_token": token}


@router.get("/shared/{token}")
def get_shared(token: str) -> dict[str, Any]:
    su = repo.get_by_share_token(token)
    if not su:
        raise HTTPException(status_code=404, detail="Shared universe not found")
    return su.public()
