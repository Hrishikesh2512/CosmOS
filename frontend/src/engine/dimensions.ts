// Dimensional physics: force laws and orbital/atomic stability per dimension.
// Mirrors backend/cosmos/physics/dimensions.py (Bertrand's theorem).

export interface DimensionalProfile {
  dimensions: number;
  force_exponent: number;
  stable_orbits: boolean;
  stable_atoms: boolean;
  structure_factor: number;
  description: string;
}

export function profile(dimensions: number): DimensionalProfile {
  if (dimensions < 1 || dimensions > 5)
    throw new Error("dimensions must be in 1..5");
  const force_exponent = dimensions - 1;

  if (dimensions === 1)
    return {
      dimensions, force_exponent, stable_orbits: false, stable_atoms: false,
      structure_factor: 0.02,
      description:
        "1D space: gravity is independent of distance (confining). No orbits, no atoms with angular momentum, no large-scale structure hierarchy. Matter clumps into a single line.",
    };
  if (dimensions === 2)
    return {
      dimensions, force_exponent, stable_orbits: true, stable_atoms: true,
      structure_factor: 0.25,
      description:
        "2D space: force ~ 1/r (logarithmic potential). Orbits are stable but the universe is a plane; chemistry is severely constrained (no knots, limited topology) and structure is flat.",
    };
  if (dimensions === 3)
    return {
      dimensions, force_exponent, stable_orbits: true, stable_atoms: true,
      structure_factor: 1.0,
      description:
        "3D space: inverse-square law. The unique 'Goldilocks' dimensionality with stable orbits, stable atoms, and rich hierarchical structure (the only case allowing both).",
    };
  return {
    dimensions, force_exponent, stable_orbits: false, stable_atoms: false,
    structure_factor: 0.0,
    description: `${dimensions}D space: force ~ 1/r^${force_exponent}. By Bertrand's theorem no stable bound orbits exist; the effective potential has no stable minimum. Atoms collapse or ionize, planets spiral into stars, and gravitationally bound systems cannot persist.`,
  };
}
