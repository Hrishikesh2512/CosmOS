"""
Dimensional physics.

The number of spatial dimensions D radically changes physical law:

* Gauss's law makes the force of gravity (and electrostatics) scale as
  ``F ~ 1 / r^(D-1)``. Only ``D = 3`` gives the familiar inverse-square law.
* **Bertrand's theorem**: bound, stable, closed orbits exist only for two
  central-force power laws -- the inverse-square force (D = 3) and the linear
  Hooke force. In D >= 4 the effective potential has no stable minimum, so
  planetary orbits, stable atoms and bound solar systems are impossible: any
  perturbation makes bodies either spiral into the centre or escape.
* In D = 1 and D = 2 gravity is confining (force constant or grows with r),
  which suppresses the open hierarchical structure needed for galaxies.

This module quantifies those effects into factors the rest of the engine uses.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DimensionalProfile:
    dimensions: int
    force_exponent: int          # F ~ r^(-force_exponent)
    stable_orbits: bool          # are bound Keplerian orbits stable?
    stable_atoms: bool           # can electron orbitals be bound & stable?
    structure_factor: float      # 0..1 viability of hierarchical structure
    description: str


def profile(dimensions: int) -> DimensionalProfile:
    """Return the dimensional viability profile for ``dimensions`` space dims."""
    if dimensions < 1 or dimensions > 5:
        raise ValueError("dimensions must be in 1..5")

    # Force law exponent from Gauss's law in D dimensions: F ~ 1/r^(D-1)
    force_exponent = dimensions - 1

    if dimensions == 1:
        return DimensionalProfile(
            1, force_exponent, stable_orbits=False, stable_atoms=False,
            structure_factor=0.02,
            description=(
                "1D space: gravity is independent of distance (confining). "
                "No orbits, no atoms with angular momentum, no large-scale "
                "structure hierarchy. Matter clumps into a single line."
            ),
        )
    if dimensions == 2:
        return DimensionalProfile(
            2, force_exponent, stable_orbits=True, stable_atoms=True,
            structure_factor=0.25,
            description=(
                "2D space: force ~ 1/r (logarithmic potential). Orbits are "
                "stable but the universe is a plane; chemistry is severely "
                "constrained (no knots, limited topology) and structure is flat."
            ),
        )
    if dimensions == 3:
        return DimensionalProfile(
            3, force_exponent, stable_orbits=True, stable_atoms=True,
            structure_factor=1.0,
            description=(
                "3D space: inverse-square law. The unique 'Goldilocks' "
                "dimensionality with stable orbits, stable atoms, and rich "
                "hierarchical structure (the only case allowing both)."
            ),
        )
    # D >= 4
    return DimensionalProfile(
        dimensions, force_exponent, stable_orbits=False, stable_atoms=False,
        structure_factor=0.0,
        description=(
            f"{dimensions}D space: force ~ 1/r^{force_exponent}. By Bertrand's "
            "theorem no stable bound orbits exist; the effective potential has "
            "no stable minimum. Atoms collapse or ionize, planets spiral into "
            "stars, and gravitationally bound systems cannot persist."
        ),
    )


def orbital_stability_factor(dimensions: int) -> float:
    """A 0..1 multiplier capturing how viable bound systems are.

    Used to gate star, planet and chemistry formation downstream.
    """
    p = profile(dimensions)
    if not p.stable_orbits:
        return 0.0
    return p.structure_factor


__all__ = ["DimensionalProfile", "profile", "orbital_stability_factor"]
