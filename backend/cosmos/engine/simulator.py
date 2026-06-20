"""
The CosmOS simulator: orchestrates the eight cosmic stages into a single,
reproducible universe-evolution run.

Stages:
    1. Big Bang            -> expansion history (cosmology)
    2. Particle Formation  -> primordial abundances (nucleosynthesis)
    3. Structure Formation -> galaxies & clusters (structure)
    4. Star Formation      -> stellar mass window, supernovae (stars)
    5. Planet Formation    -> rocky worlds, gas giants, HZ (planets)
    6. Chemistry           -> stable elements, complexity (chemistry)
    7. Life Emergence      -> probability & complexity (life)
    8. Civilization        -> intelligence, technology, fate (civilization)

The result is a :class:`SimulationResult` carrying every stage's structured
output, a scorecard, and a timeline.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any
import time

import numpy as np

from ..physics.parameters import UniverseParameters, EffectiveConstants
from ..physics import cosmology, nucleosynthesis, structure, stars, planets
from ..physics import chemistry, life, civilization, dimensions
from .timeline import build_timeline, TimelineEvent
from .scorecard import build_scorecard, Scorecard


@dataclass
class StageResult:
    index: int
    name: str
    success: bool
    summary: str
    data: dict[str, Any]


@dataclass
class SimulationResult:
    universe_id: str
    parameters: dict[str, Any]
    effective_constants: dict[str, Any]
    dimensional_profile: dict[str, Any]
    stages: list[StageResult]
    timeline: list[TimelineEvent]
    scorecard: Scorecard
    visualization: dict[str, Any]
    compute_time_ms: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "universe_id": self.universe_id,
            "parameters": self.parameters,
            "effective_constants": self.effective_constants,
            "dimensional_profile": self.dimensional_profile,
            "stages": [asdict(s) for s in self.stages],
            "timeline": [asdict(e) for e in self.timeline],
            "scorecard": asdict(self.scorecard),
            "visualization": self.visualization,
            "compute_time_ms": self.compute_time_ms,
        }


def _clean(obj: Any) -> Any:
    """Recursively convert numpy types to JSON-safe Python types."""
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return [_clean(v) for v in obj.tolist()]
    if isinstance(obj, (np.floating, np.integer)):
        v = obj.item()
        return v
    if isinstance(obj, float):
        if obj != obj or obj in (float("inf"), float("-inf")):
            return None
        return obj
    return obj


class Simulator:
    """Runs a full universe simulation from a parameter set."""

    def __init__(self, params: UniverseParameters):
        self.params = params
        self.ec: EffectiveConstants = params.effective()

    def run(self) -> SimulationResult:
        t0 = time.perf_counter()
        ec = self.ec
        stages: list[StageResult] = []

        dprof = dimensions.profile(ec.dimensions)

        # --- Stage 1: Big Bang / expansion -------------------------------
        exp = cosmology.expansion_history(ec)
        stages.append(StageResult(
            1, "Big Bang", True,
            f"Universe expands; fate: {exp.fate}.",
            _clean({
                "fate": exp.fate,
                "age_gyr": exp.age_gyr,
                "will_recollapse": exp.will_recollapse,
                "recollapse_time_gyr": exp.recollapse_time_gyr,
                "growth_factor": exp.growth_factor,
                "omega_total": exp.omega_total,
                "scale_factor": exp.scale_factor[::8],
                "time_gyr": exp.time_gyr[::8],
            }),
        ))

        # --- Stage 2: Particle / nucleosynthesis -------------------------
        bbn = nucleosynthesis.primordial_abundances(ec)
        stages.append(StageResult(
            2, "Particle Formation", bbn.viable,
            bbn.note,
            _clean(asdict(bbn)),
        ))

        # --- Stage 3: Structure formation --------------------------------
        struct = structure.form_structure(ec, exp)
        stages.append(StageResult(
            3, "Structure Formation", struct.galaxies_form,
            struct.note,
            _clean(asdict(struct)),
        ))

        # --- Stage 4: Star formation -------------------------------------
        sprof = stars.stellar_profile(ec)
        imf = stars.initial_mass_function(sprof, seed=self.params.seed)
        stages.append(StageResult(
            4, "Star Formation", sprof.stars_possible,
            sprof.note,
            _clean({**asdict(sprof), "imf_sample": imf[:200]}),
        ))

        # --- Stage 5: Planet formation -----------------------------------
        pl = planets.form_planets(
            ec, sprof, bbn, struct.structure_richness, sprof.supernova_capable,
        )
        stages.append(StageResult(
            5, "Planet Formation", pl.rocky_worlds,
            pl.note,
            _clean(asdict(pl)),
        ))

        # --- Stage 6: Chemistry ------------------------------------------
        chem = chemistry.evaluate_chemistry(ec, pl, bbn)
        stages.append(StageResult(
            6, "Chemistry", chem.complexity_score > 0.2,
            chem.note,
            _clean(asdict(chem)),
        ))

        # --- Stage 7: Life -----------------------------------------------
        lf = life.evaluate_life(ec, chem, pl, sprof, exp, struct.first_galaxy_gyr)
        stages.append(StageResult(
            7, "Life Emergence", lf.emerges,
            lf.note,
            _clean(asdict(lf)),
        ))

        # --- Stage 8: Civilization ---------------------------------------
        civ = civilization.simulate_civilization(
            lf, lf.time_available_gyr, seed=self.params.seed,
        )
        stages.append(StageResult(
            8, "Civilization Emergence", civ.civilizations_emerge,
            civ.note,
            _clean(asdict(civ)),
        ))

        scorecard = build_scorecard(exp, bbn, struct, sprof, pl, chem, lf, civ)
        timeline = build_timeline(exp, struct, sprof, pl, lf, civ)
        viz = self._visualization(exp, struct, sprof, pl, civ, imf)

        dt = (time.perf_counter() - t0) * 1000.0

        return SimulationResult(
            universe_id=scorecard.universe_id,
            parameters=self.params.to_dict(),
            effective_constants=_clean(ec.as_dict()),
            dimensional_profile=_clean(asdict(dprof)),
            stages=stages,
            timeline=timeline,
            scorecard=scorecard,
            visualization=_clean(viz),
            compute_time_ms=dt,
        )

    # -- visualization payload -------------------------------------------
    def _visualization(self, exp, struct, sprof, pl, civ, imf) -> dict[str, Any]:
        """Generate procedural point clouds and metadata for the 3D views."""
        rng = np.random.default_rng(self.params.seed + 7)

        # Universe view: galaxies distributed in a cosmic-web-like field.
        n_gal = int(np.clip(struct.n_galaxies_estimate * 400, 0, 4000))
        if struct.galaxies_form and n_gal > 0:
            # cluster galaxies around random web nodes for filamentary look
            n_nodes = max(1, n_gal // 40)
            nodes = rng.normal(0, 60, size=(n_nodes, 3))
            idx = rng.integers(0, n_nodes, size=n_gal)
            gal = nodes[idx] + rng.normal(0, 8, size=(n_gal, 3))
            gal_brightness = rng.uniform(0.3, 1.0, size=n_gal)
        else:
            gal = np.zeros((0, 3))
            gal_brightness = np.zeros(0)

        # Galaxy view: stars colored by mass (temperature proxy).
        n_stars = int(min(len(imf), 3000))
        if n_stars > 0:
            star_masses = imf[:n_stars]
            r = rng.uniform(0, 40, n_stars) ** 0.5 * 6
            theta = rng.uniform(0, 2 * np.pi, n_stars)
            arm = (theta + r * 0.3) % (2 * np.pi)
            sx = r * np.cos(arm) + rng.normal(0, 2, n_stars)
            sy = rng.normal(0, 1.5, n_stars)
            sz = r * np.sin(arm) + rng.normal(0, 2, n_stars)
            stars_xyz = np.stack([sx, sy, sz], axis=1)
        else:
            star_masses = np.zeros(0)
            stars_xyz = np.zeros((0, 3))

        # Solar system view: planet orbits.
        n_planets = int(np.clip(round(pl.n_rocky_per_star + 2), 0, 12)) if pl.gas_giants else 0
        sys_planets = []
        for i in range(n_planets):
            a = 0.4 + i * 0.5 + rng.uniform(0, 0.2)
            sys_planets.append({
                "semi_major_au": float(a),
                "radius_earth": float(rng.uniform(0.3, 11)),
                "is_rocky": bool(a < pl.habitable_zone_width_au * 6 + 2),
                "in_habitable_zone": bool(abs(a - 1.0) < pl.habitable_zone_width_au * 3),
            })

        return {
            "universe": {
                "galaxies": gal,
                "brightness": gal_brightness,
                "expansion_rate": float(exp.hubble[-1]) if len(exp.hubble) else 0.0,
                "count": int(n_gal),
            },
            "galaxy": {
                "stars": stars_xyz,
                "masses": star_masses,
                "count": int(n_stars),
            },
            "solar_system": {
                "planets": sys_planets,
                "habitable_zone_au": float(pl.habitable_zone_width_au),
            },
            "civilization": {
                "timeline_years": civ.timeline_years[::4] if civ.timeline_years else [],
                "population": civ.population[::4] if civ.population else [],
                "tech": civ.tech[::4] if civ.tech else [],
                "expansion": civ.expansion[::4] if civ.expansion else [],
                "extinction_events": civ.extinction_events,
            },
        }


def simulate(params: UniverseParameters) -> SimulationResult:
    return Simulator(params).run()


__all__ = ["Simulator", "SimulationResult", "StageResult", "simulate", "_clean"]
