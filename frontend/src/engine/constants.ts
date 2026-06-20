// Fundamental physical constants (SI units) for the baseline ("our") universe.
// Mirrors backend/genesis/physics/constants.py (CODATA 2018).

export const C_LIGHT = 2.99792458e8;
export const G_NEWTON = 6.6743e-11;
export const H_PLANCK = 6.62607015e-34;
export const HBAR = H_PLANCK / (2 * Math.PI);
export const E_CHARGE = 1.602176634e-19;
export const K_BOLTZMANN = 1.380649e-23;
export const EPSILON_0 = 8.8541878128e-12;
export const ALPHA_FS = 7.2973525693e-3;

export const M_ELECTRON = 9.1093837015e-31;
export const M_PROTON = 1.67262192369e-27;
export const M_NEUTRON = 1.67492749804e-27;
export const M_NEUTRON_PROTON_DIFF = (M_NEUTRON - M_PROTON) * C_LIGHT ** 2;

export const M_SUN = 1.98847e30;
export const PARSEC = 3.085677581e16;
export const MPC = 1e6 * PARSEC;
export const YEAR = 3.155814954e7;
export const GYR = 1e9 * YEAR;

export const H0_KM_S_MPC = 67.36;
export const H0_SI = (H0_KM_S_MPC * 1e3) / MPC;
export const OMEGA_M = 0.3153;
export const OMEGA_B = 0.0493;
export const OMEGA_DM = OMEGA_M - OMEGA_B;
export const OMEGA_LAMBDA = 0.6847;
export const OMEGA_R = 9.182e-5;
export const T_CMB = 2.7255;
export const AGE_UNIVERSE_GYR = 13.797;

export const CHANDRASEKHAR_SUN = 1.44;
export const STAR_MIN_MASS_SUN = 0.08;
export const STAR_MAX_MASS_SUN = 150.0;
