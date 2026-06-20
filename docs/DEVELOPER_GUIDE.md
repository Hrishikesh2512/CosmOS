# Genesis - Developer Guide

## Prerequisites

- Python 3.10+ (tested on 3.11)
- Node 18+ (tested on 24)

## Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional
python -m pip install -r requirements.txt
python -m pip install -e ".[dev]"                   # editable + test deps
```

Run the API:

```bash
uvicorn genesis.api.main:app --reload --port 8000
```

Use the engine as a library:

```python
from genesis import simulate, UniverseParameters, AIScientist

result = simulate(UniverseParameters(name="Strong G", G_mult=100))
print(result.scorecard.outcome)

ai = AIScientist(result)
print(ai.ask("Why did life fail to emerge?").suggestions)
```

## Testing

```bash
cd backend
python -m pytest                 # all tests + coverage report
python -m pytest tests/test_physics_validation.py --no-cov   # just physics
```

- `test_physics_validation.py` - the **scientific contract**: baseline matches
  reality; constants scale correctly (e.g. `M_Ch ∝ G^{-3/2}`); Bertrand's
  theorem; nucleosynthesis trends; cosmic fates.
- `test_engine.py` - end-to-end stage orchestration, determinism,
  JSON-serializability.
- `test_api.py` - FastAPI integration (uses `TestClient`, isolated repo per
  test).
- `test_ai.py` - AI Scientist diagnoses and What-If parsing/comparison.

Coverage target is **90%+**; current ≈ 94%.

## Frontend setup

```bash
cd frontend
npm install
npm run dev          # dev server on :5173, proxies /api → :8000
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

## Adding a new physics stage

1. Create `genesis/physics/<stage>.py` with a dataclass result and a pure
   function `evaluate_<stage>(ec, ...prev_results) -> Result`. Normalize so the
   baseline reproduces reality.
2. Add validation tests in `tests/test_physics_validation.py` asserting both the
   baseline value and the *direction* of response to a parameter change.
3. Wire it into `engine/simulator.py` (`run()`), append a `StageResult`, and
   thread its output to later stages.
4. Surface it in `scorecard.py` / `timeline.py` if it is a milestone.
5. Add a visualization payload in `Simulator._visualization` and a view/section
   in the frontend if needed.

## Adding a new API endpoint

1. Add a Pydantic model in `api/schemas.py`.
2. Add the route in `api/routes.py`.
3. Add an `api/client.ts` method and types in `types.ts`.
4. Add a `test_api.py` case.

## Conventions

- **Engine is web-free**: never import FastAPI/Pydantic inside `physics/` or
  `engine/`.
- **JSON safety**: anything returned from the engine passes through
  `engine.simulator._clean` (NumPy → Python, NaN/Inf → null). Keep new payloads
  JSON-serializable.
- **Determinism**: stochastic stages (civilization, visualization) must use the
  seeded `numpy.random.default_rng(seed)` so runs are reproducible.
- **Self-consistency**: derive all physics from `EffectiveConstants`; don't read
  raw multipliers in stage code.

## Performance notes

- A full simulation is ~5–20 ms. The cosmology integration dominates; it uses a
  fixed-step `solve_ivp` plus an analytic turning-point scan.
- Visualization point clouds are subsampled server-side (`[::8]`, capped counts)
  to keep payloads small.

## Optional: LLM enrichment

The AI Scientist is fully deterministic and needs no external service. If you
want natural-language polish, you can layer an Anthropic call on top of
`Diagnosis` (the latest models are `claude-opus-4-8` / `claude-sonnet-4-6`);
keep the analytical core as the grounded source of truth.
