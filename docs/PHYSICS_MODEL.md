# Genesis - Physics Model Guide

This document explains the physics behind each simulation stage, the key
equations, and how each user parameter propagates through the causal chain.

> **Normalization principle.** Every model is written so that the *baseline*
> universe - all constant multipliers = 1, 3 spatial dimensions, our matter
> content - reproduces our own universe. Changes are expressed relative to that
> baseline, and the direction/magnitude of every response is enforced by the
> tests in `tests/test_physics_validation.py`.

## Parameters → effective constants

`UniverseParameters.effective()` turns dimensionless multipliers into concrete
constants:

- `c = c₀ · c_mult`, `G = G₀ · G_mult`, `h = h₀ · h_mult`, `e = e₀ · e_mult`.
- The fine-structure constant is honoured directly: since
  `α = e² / (4πε₀ħc)`, we solve for `ε₀ = e² / (4π·α·ħc)` so the
  electromagnetic coupling stays self-consistent with the requested `α`.
- Matter content: `Ω_m = Ω_m₀ · density_scale`; the dark-matter fraction splits
  it into `Ω_b` (baryons) and `Ω_dm`; `Ω_Λ = Ω_Λ₀ · dark_energy_strength`.

## Stage 1 - Big Bang (cosmology)

Integrates the Friedmann equation

```
(ȧ/a)² = H₀² [ Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_Λ + Ω_k a⁻² ]
```

- `H₀` is rescaled by `√(G/G₀)` because `H² ∝ Gρ`.
- **Curvature** closes the *matter* budget: `Ω_k = 1 − (Ω_r + Ω_m)`. This is the
  key modelling choice that gives the correct qualitative fates:
  - matter-dominated closed universe (`Ω_m > 1`) → **Big Crunch**;
  - large dark energy → **runaway expansion / Big Rip** (dark energy is *not*
    folded into curvature, so it accelerates rather than collapses);
  - low density → open eternal expansion.
- Recollapse is detected **analytically** (first `a` where `H² ≤ 0`) rather than
  by integrating through the turnaround, where `ȧ ∝ √H² → 0` is singular.
- A linear **growth factor** for structure is derived from `Ω_m` vs `Ω_Λ`
  (dark energy freezes growth).

## Stage 2 - Particle Formation (nucleosynthesis)

The primordial helium fraction `Y_p` is set by the neutron/proton ratio at weak
freeze-out:

```
n/p|freeze = exp(−Q / kT_freeze),   Q = (m_n − m_p)c²
```

Faster expansion (stronger `G`) freezes the weak interactions out **earlier**
(higher `T_freeze ∝ G^{1/6}` in the reduced model), leaving more neutrons and
thus **more helium**. A universe that ends up almost pure helium (no hydrogen)
cannot make water or organics - a downstream gate.

## Stage 3 - Structure Formation

Combines the cosmological growth factor, the **dark-matter scaffold**
(`0.2 + 0.8·f_dm`), matter content and the dimensional structure factor. Without
dark matter, baryonic perturbations are washed out before recombination, so
galaxies form late and sparse. In `D ≠ 3`, bound structure is impossible.

## Stage 4 - Star Formation

- **Chandrasekhar mass**: `M_Ch ∝ (ħc/G)^{3/2} / m_p²`, normalized to 1.44 M☉.
  Stronger gravity → smaller `M_Ch` → smaller stellar mass window.
- The stable mass window runs from a fusion-ignition floor (`~0.08 M☉` scaled by
  `M_Ch`) to a radiation-pressure ceiling (`~150 M☉`).
- **Lifetime**: `t_MS ∝ M/L`; with stronger gravity raising core burn rates,
  `t ∝ 1/G`. A 100× gravity universe burns its stars out in ~0.1 Gyr - far too
  fast for life.
- Supernovae (needed to seed metals) require `M_max ≥ 8 M☉`.
- In `D ≠ 3` there is no stable hydrostatic equilibrium → no stars.

## Stage 5 - Planet Formation

Requires stable orbits (3D), stars, and **metals** from prior supernovae.
Metallicity builds with structure richness and supernova seeding. The
**habitable-zone width** is modulated by a chemistry band centred on baseline
`α` (bonds/liquid-water range), so a mistuned `α` collapses the HZ.

## Stage 6 - Chemistry

- **Heaviest stable element** scales as `Z_max ∝ 1/α` (≈137 at baseline → ~92
  usable elements). Larger `α` truncates the periodic table.
- **Bond strength** `∝ α²` (Rydberg energy); molecular richness peaks near
  baseline `α` (a log-normal band).
- Needs hydrogen (for water/organics) and metals (for `Z > 2`). 2D chemistry is
  topologically impoverished (penalty applied). Outputs a complexity score, a
  count of stable elements, and carbon/water booleans.

## Stage 7 - Life Emergence

Hard gates: carbon chemistry, stable water, rocky worlds. Then a
Drake-equation-flavoured probability:

```
P_life = P_chem · (1 − e^{−t/2}) · (1 − e^{−3·n_hab})
```

where `t` is the **time available** (from planet formation until the host star
or the universe dies). Biological complexity needs the longer window
(`≳ 3.5 Gyr`). This is where short-lived (high-`G`) or short-lived
(recollapsing) universes fail even if chemistry was fine.

## Stage 8 - Civilization

Given complex life, a seeded stochastic model grows technology logistically
(Kardashev-flavoured 0–10 scale), scales population, tracks colonization, and
applies a rising **extinction hazard** (a "great filter" - natural causes at low
tech, self-inflicted at high tech). Produces a civilization count, peak tech,
extinction-event log and an outcome classification.

## The causal chain

```
constants ─▶ expansion ─▶ nucleosynthesis ─▶ structure ─▶ stars
        ─▶ planets ─▶ chemistry ─▶ life ─▶ civilization
```

A break anywhere downstream-gates everything after it. The AI Scientist walks
this chain backwards to find the first broken link.

## Worked examples

| Change | Effect | Why |
|--------|--------|-----|
| `G ×100` | Sterile: stars die in ~0.1 Gyr | `t ∝ 1/G`; window shrinks (`M_Ch ∝ G^{-3/2}`) |
| `dimensions = 4` | Barren | Bertrand: no stable orbits/atoms/structure |
| `dark_matter = 0` | Few, late galaxies | No scaffold; baryon perturbations damped |
| `dark_energy ×50` | Structure frozen / Big Rip | Λ dominates, halts growth, tears bound systems |
| `α ×3` | No complex chemistry | `Z_max ∝ 1/α` truncates the periodic table |
| density = extreme, Λ=0 | Big Crunch | Closed universe (`Ω_m > 1`) recollapses |
