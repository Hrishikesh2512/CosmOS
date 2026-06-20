"""
Fundamental physical constants (SI units) for the baseline ("our") universe.

These are the reference values. A CosmOS universe is defined by *multipliers*
applied to a subset of these constants (see :mod:`cosmos.physics.parameters`).
All derived physics in the engine is expressed relative to these baselines so
that a multiplier of ``1.0`` everywhere reproduces the real universe.

Sources: CODATA 2018 recommended values.
"""

from __future__ import annotations

import math

# --- Universal constants -------------------------------------------------
C_LIGHT = 2.997_924_58e8          # speed of light in vacuum [m/s]
G_NEWTON = 6.674_30e-11           # gravitational constant [m^3 kg^-1 s^-2]
H_PLANCK = 6.626_070_15e-34       # Planck constant [J s]
HBAR = H_PLANCK / (2.0 * math.pi)  # reduced Planck constant [J s]
E_CHARGE = 1.602_176_634e-19      # elementary charge [C]
K_BOLTZMANN = 1.380_649e-23       # Boltzmann constant [J/K]
EPSILON_0 = 8.854_187_8128e-12    # vacuum permittivity [F/m]
ALPHA_FS = 7.297_352_5693e-3      # fine-structure constant (~1/137) [-]

# --- Particle masses -----------------------------------------------------
M_ELECTRON = 9.109_383_7015e-31   # electron mass [kg]
M_PROTON = 1.672_621_923_69e-27   # proton mass [kg]
M_NEUTRON = 1.674_927_498_04e-27  # neutron mass [kg]
M_NEUTRON_PROTON_DIFF = (M_NEUTRON - M_PROTON) * C_LIGHT ** 2  # [J] (~1.293 MeV)

# --- Astrophysical / cosmological scales --------------------------------
M_SUN = 1.988_47e30               # solar mass [kg]
L_SUN = 3.828e26                  # solar luminosity [W]
R_SUN = 6.957e8                   # solar radius [m]
M_EARTH = 5.972_2e24              # Earth mass [kg]
AU = 1.495_978_707e11            # astronomical unit [m]
PARSEC = 3.085_677_581e16         # parsec [m]
MPC = 1e6 * PARSEC                # megaparsec [m]
YEAR = 3.155_814_954e7            # Julian year [s]
GYR = 1e9 * YEAR                  # gigayear [s]

# --- Cosmological reference values (Planck 2018, flat LambdaCDM) ---------
H0_KM_S_MPC = 67.36               # Hubble constant [km/s/Mpc]
H0_SI = H0_KM_S_MPC * 1e3 / MPC   # Hubble constant [1/s]
OMEGA_M = 0.3153                  # total matter density parameter
OMEGA_B = 0.0493                  # baryonic matter density parameter
OMEGA_DM = OMEGA_M - OMEGA_B      # cold dark matter density parameter
OMEGA_LAMBDA = 0.6847             # dark-energy density parameter
OMEGA_R = 9.182e-5                # radiation density parameter
T_CMB = 2.7255                    # CMB temperature today [K]
AGE_UNIVERSE_GYR = 13.797         # age of the universe [Gyr]

# Critical density today: rho_c = 3 H0^2 / (8 pi G)  [kg/m^3]
RHO_CRIT = 3.0 * H0_SI ** 2 / (8.0 * math.pi * G_NEWTON)

# --- Derived reference quantities ---------------------------------------
# Chandrasekhar mass ~ (hbar c / G)^(3/2) / m_p^2, ~1.4 M_sun
CHANDRASEKHAR_SUN = 1.44

# Stellar fusion ignition floor (~0.08 M_sun) and upper stability (~150 M_sun)
STAR_MIN_MASS_SUN = 0.08
STAR_MAX_MASS_SUN = 150.0

__all__ = [name for name in dir() if not name.startswith("_")]
