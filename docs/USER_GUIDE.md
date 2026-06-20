# CosmOS - User Guide

## Getting started

1. Start the backend (`uvicorn cosmos.api.main:app --port 8000`) and frontend
   (`npm run dev`), then open <http://localhost:5173>.
2. The left panel holds the **Universe Parameters**. The centre is the
   **Viewport**. The right rail shows results once you create a universe.

## Creating a universe

1. **Name** your universe (optional).
2. Adjust the **Fundamental Constants** (logarithmic sliders, shown as
   multiples of our universe):
   - **Speed of Light (c)** - affects relativistic limits and energy scales.
   - **Gravitational Constant (G)** - the most dramatic knob: controls
     expansion, star lifetimes and the stellar mass window.
   - **Planck Constant (h)**, **Elementary Charge (e)**, **Fine-Structure
     Constant (α)** - control quantum scales and chemistry.
3. Set the **Cosmological Parameters**:
   - **Spatial Dimensions (1–5)** - only **3D** allows stable orbits *and*
     stable atoms.
   - **Initial Matter Density** - Near Empty → Extreme.
   - **Dark Matter Fraction (0–90%)** - the scaffolding for galaxies.
   - **Dark Energy Strength (0–100×)** - too much tears structure apart.
4. Press **✦ Create Universe**. Simulation takes a few milliseconds.

## Reading the results

### Scorecard
Shows milestone pass/fail (Galaxies, Stars, Planets, Chemistry, Life,
Intelligence, Civilizations), a **habitability index**, the **outcome** verdict,
and highlights.

### Views (centre tabs)
- **🌌 Universe** - the cosmic web of galaxies (drag to orbit, scroll to zoom).
- **✨ Galaxy** - stars coloured by mass/temperature around a central bulge.
- **🪐 Solar System** - animated planetary orbits; habitable worlds are marked.
- **🛰 Civilization** - technology, colonization and extinction-event charts.

### Timeline
A per-universe chronology, from the Big Bang to civilizations (or to a Big
Crunch).

## The What-If Engine

Type a question like *"What if gravity was 100× stronger?"* or click an example.
CosmOS simulates the alternate universe, compares it to your current one, and
shows which milestones were **gained (+)** or **lost (−)**, plus the change in
habitability. Recognized phrases include gravity, speed of light, Planck
constant, charge, fine-structure constant / α, dimensions, dark matter and dark
energy, with factors like "10×", "100x stronger", "slower", "without".

## The AI Scientist

Ask *why* your universe turned out the way it did:
- "Why did life fail to emerge?"
- "Why did galaxies collapse?"
- "How can I create a life-friendly universe?"

It returns an answer, the **root causes** (walking the causal chain back to the
first broken link), and concrete **suggestions** for fixing your parameters.

## Save & Share

- **💾 Save** stores the current parameters (and last result).
- Saved universes can be **loaded** (click the name), **shared** (🔗 generates a
  link token) or **deleted** (🗑).
- **📄 Export Report** downloads a Markdown report (parameters, stages,
  timeline).
- **📷 Screenshot** saves a PNG of the current 3D view.

## Tips for a life-bearing universe

- Keep **dimensions = 3**.
- Keep **G** within ~0.5–2× (stronger gravity burns stars out too fast).
- Keep **α** within ~25% of baseline (chemistry is fragile).
- Use **moderate–dense** matter with a **high dark-matter fraction (~0.8)**.
- Keep **dark energy near 1×** (enough time to form structure, no recollapse).
