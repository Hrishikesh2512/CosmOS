# ✦ CosmOS - Universe Creation & Evolution Simulator

CosmOS lets you **modify the fundamental laws of reality and watch entire
universes emerge**. Change the speed of light, crank up gravity, add a fourth
spatial dimension, or delete dark matter - then press **Create Universe** and
watch CosmOS simulate the consequences from the Big Bang all the way to
civilizations.

It combines the feel of *Universe Sandbox*, *Civilization* and *No Man's Sky*
with a genuinely physics-grounded simulation engine.

> What if gravity was 100× stronger? What if the speed of light was slower? What
> if space had 4 dimensions? CosmOS answers these questions by *simulating* them.

---

## What it does

From a handful of fundamental constants and cosmological parameters, CosmOS
runs an **eight-stage simulation**:

| Stage | What it computes |
|-------|------------------|
| 1. Big Bang | Expansion history via the Friedmann equation; cosmic fate (eternal expansion, Big Crunch, Big Rip) |
| 2. Particle Formation | Big Bang nucleosynthesis - primordial H/He abundances |
| 3. Structure Formation | Dark-matter-seeded galaxies and clusters |
| 4. Star Formation | The stellar mass window, Chandrasekhar limit, lifetimes, supernovae |
| 5. Planet Formation | Rocky worlds, gas giants, metallicity, habitable zones |
| 6. Chemistry | Stable elements, carbon/water chemistry, complexity |
| 7. Life Emergence | Probability of biogenesis and biological complexity |
| 8. Civilization | Intelligence, technology trajectory, extinction events |

Every result is **grounded in real physics**: Bertrand's theorem (only 3D space
has stable orbits), the Chandrasekhar mass `M_Ch ~ (ħc/G)^(3/2)/m_p²`, the
fine-structure constant's control over chemistry, and more. See
[`docs/PHYSICS_MODEL.md`](docs/PHYSICS_MODEL.md).

## Features

- 🎛 **Parameter sliders** for `c`, `G`, `h`, `e`, `α`, spatial dimensions (1–5),
  matter density, dark matter fraction and dark energy strength.
- 🌌 **Four 3D/visualization views**: Universe (cosmic web), Galaxy (stars),
  Solar System (orbits), Civilization (population/tech charts).
- 🏆 **Universe Scorecard** with milestone pass/fail and an outcome verdict.
- 🕰 **Cosmic Timeline** generated per universe.
- 🌀 **What-If Engine** - natural language ("what if gravity was 100× stronger?")
  compared against a baseline.
- 🔬 **AI Scientist** - explains *why* a universe turned out the way it did and
  *how* to make it life-friendly.
- 💾 **Save / load / share** universes; export reports and screenshots.

## Live demo

The app is deployed as a fully static site on GitHub Pages:
**https://hrishikesh2512.github.io/CosmOS/**

The frontend ships with a complete TypeScript port of the simulation engine
(`frontend/src/engine`), so the live site runs entirely in your browser with **no
backend required** - every universe is simulated client-side in milliseconds, and
saved universes are stored in `localStorage`. The Python/FastAPI backend
(`backend/`) is an optional, identical reference implementation for those who
prefer a server, notebooks or batch parameter sweeps.

## Tech stack

- **Frontend**: React + TypeScript + Vite + Tailwind + Three.js
  (`@react-three/fiber`) + Recharts + Zustand.
- **Backend**: Python + FastAPI.
- **Simulation engine**: NumPy + SciPy.

## Quick start

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn cosmos.api.main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173  (proxies /api to localhost:8000)
```

### Run the tests

```bash
cd backend
python -m pytest          # 59 tests, ~94% coverage, incl. physics validation
```

## Project layout

```
backend/
  cosmos/
    physics/      # the scientific core (constants, cosmology, stars, chemistry…)
    engine/       # 8-stage orchestration, timeline, scorecard
    ai/           # AI Scientist + What-If engine
    api/          # FastAPI app, routes, schemas
    storage/      # save/load/share repository
  tests/          # unit, integration & physics-validation tests
frontend/
  src/
    components/   # ControlPanel, Scorecard, Timeline, AIScientist, …
      views/      # Three.js Universe/Galaxy/SolarSystem + Civilization charts
    store/        # Zustand state
    api/          # typed API client
docs/             # architecture, physics model, user & developer guides
```

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Physics Model Guide](docs/PHYSICS_MODEL.md)
- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)

## A note on scientific scope

CosmOS is a *serious* simulation platform, not a toy. Its models are
order-of-magnitude, normalized so that the baseline (all multipliers = 1, 3D)
reproduces our own universe, and they respond in the correct direction and
magnitude to changes in the constants - this is enforced by a suite of physics
validation tests. They are **not** a substitute for full N-body / hydrodynamic
cosmological simulations; they are tractable analytic/semi-analytic models
chosen so that an entire universe can be simulated interactively in
milliseconds.
