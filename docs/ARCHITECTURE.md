# Genesis - Architecture Guide

## Overview

Genesis is a two-tier application:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TS + Three.js)                        │
│  • ControlPanel (sliders) → params                       │
│  • Viewport (4 Three.js / Recharts views)                │
│  • Scorecard, Timeline, AI Scientist, What-If, Save      │
│  • Zustand store, typed fetch client                     │
└───────────────┬─────────────────────────────────────────┘
                │ HTTP / JSON  (/api/*)
┌───────────────▼─────────────────────────────────────────┐
│  Backend (FastAPI)                                       │
│  routes → schemas → engine → physics                    │
│                          ↘ ai (scientist, what-if)      │
│                          ↘ storage (save/share)         │
└─────────────────────────────────────────────────────────┘
```

The **simulation engine is pure Python/NumPy/SciPy** and has no web
dependencies - it can be imported and used as a library (`import genesis`).

## Backend layers

### `genesis.physics` - the scientific core
Independent, individually-testable modules, each modelling one physical domain.
All are *normalized*: with baseline parameters (all multipliers = 1, 3D) they
reproduce our universe.

- `constants.py` - CODATA baseline constants.
- `parameters.py` - `UniverseParameters` (user input) → `EffectiveConstants`
  (resolved physical constants). This is the single source of truth for how the
  multipliers turn into physics (including keeping `α = e²/4πε₀ħc`
  self-consistent).
- `dimensions.py` - force laws and orbital/atomic stability per dimensionality
  (Bertrand's theorem).
- `cosmology.py` - Friedmann-equation integration, fate, structure growth.
- `nucleosynthesis.py`, `structure.py`, `stars.py`, `planets.py`,
  `chemistry.py`, `life.py`, `civilization.py` - the remaining stages.

### `genesis.engine` - orchestration
- `simulator.py` - runs the 8 stages in order, threading each stage's output
  into the next; produces a `SimulationResult` (stages + scorecard + timeline +
  visualization payload). `_clean()` makes everything JSON-safe (NumPy → Python,
  NaN/Inf → null).
- `timeline.py` - derives the cosmic timeline.
- `scorecard.py` - milestone pass/fail, habitability index, verdict.

### `genesis.ai`
- `scientist.py` - a deterministic, explainable causal-reasoning engine that
  inspects a `SimulationResult` and answers "why/how" questions. No external LLM
  required (so it is reproducible and always grounded in the actual run).
- `whatif.py` - parses natural-language prompts into parameter changes and
  produces a milestone-by-milestone `Comparison` against a baseline.

### `genesis.api`
- `main.py` - FastAPI app + CORS.
- `routes.py` - `/simulate`, `/whatif`, `/ask`, `/baseline`, and the
  `/universes` CRUD + `/share` endpoints.
- `schemas.py` - Pydantic request/response models.

### `genesis.storage`
- `repository.py` - atomic JSON file store for saved universes (swap for a real
  DB behind the same interface).

## Frontend structure

- `store/useStore.ts` - Zustand store holds `params`, `result`, `view`,
  `comparison`; exposes `createUniverse`, `runWhatIf`, etc.
- `api/client.ts` - typed wrapper over `fetch`.
- `components/` - `ControlPanel`, `Scorecard`, `Timeline`, `AIScientist`,
  `WhatIfPanel`, `SavePanel`, `Viewport`.
- `components/views/` - `UniverseView`, `GalaxyView`, `SolarSystemView`
  (Three.js), `CivilizationView` (Recharts).

## Data flow for "Create Universe"

1. `ControlPanel` mutates `params` in the store.
2. `createUniverse()` POSTs `params` to `/api/simulate`.
3. Backend `simulate()` runs all 8 stages → `SimulationResult.to_dict()`.
4. Store saves `result`; `Viewport` renders the visualization payload; the
   right rail renders scorecard, timeline, AI scientist and what-if panels.

## Why this design

- **Library-first engine**: the physics is decoupled from HTTP, so it is unit
  testable and reusable (CLI, notebooks, batch parameter sweeps).
- **Stateless AI endpoint**: `/ask` takes the full result in the request, so the
  backend holds no per-session state and scales horizontally.
- **Self-consistent constants**: all derived physics flows from
  `EffectiveConstants`, preventing contradictory parameter combinations.
