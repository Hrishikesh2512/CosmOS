"""
Physics validation tests.

These assert that the engine reproduces known physics for the baseline universe
and responds correctly (in direction and magnitude) to changes in fundamental
constants. They are the scientific contract of CosmOS.
"""

import math

import pytest

from cosmos.physics import constants as K
from cosmos.physics.parameters import UniverseParameters, MatterDensity, baseline
from cosmos.physics import dimensions, cosmology, nucleosynthesis, stars, chemistry


# --- Baseline reproduces our universe -----------------------------------
def test_baseline_constants_match_real_world():
    ec = baseline().effective()
    assert math.isclose(ec.c, K.C_LIGHT, rel_tol=1e-9)
    assert math.isclose(ec.G, K.G_NEWTON, rel_tol=1e-9)
    # alpha self-consistency: alpha = e^2 / (4 pi eps0 hbar c)
    alpha = ec.e ** 2 / (4 * math.pi * ec.epsilon_0 * ec.hbar * ec.c)
    assert math.isclose(alpha, K.ALPHA_FS, rel_tol=1e-6)


def test_chandrasekhar_baseline():
    ec = baseline().effective()
    m_ch = stars.chandrasekhar_mass(ec)
    assert math.isclose(m_ch, K.CHANDRASEKHAR_SUN, rel_tol=1e-6)


# --- Dimensionality (Bertrand's theorem) --------------------------------
@pytest.mark.parametrize("d,stable", [(1, False), (2, True), (3, True), (4, False), (5, False)])
def test_orbital_stability_by_dimension(d, stable):
    assert dimensions.profile(d).stable_orbits is stable


def test_only_3d_has_full_structure():
    assert dimensions.profile(3).structure_factor == 1.0
    assert dimensions.profile(4).structure_factor == 0.0


def test_force_exponent_inverse_square_in_3d():
    assert dimensions.profile(3).force_exponent == 2  # F ~ 1/r^2


# --- Chandrasekhar mass scaling -----------------------------------------
def test_stronger_gravity_lowers_chandrasekhar_mass():
    weak = stars.chandrasekhar_mass(UniverseParameters(G_mult=0.5).effective())
    strong = stars.chandrasekhar_mass(UniverseParameters(G_mult=2.0).effective())
    assert strong < weak  # M_Ch ~ G^-3/2


def test_chandrasekhar_scales_as_g_power_minus_three_halves():
    base = stars.chandrasekhar_mass(baseline().effective())
    g4 = stars.chandrasekhar_mass(UniverseParameters(G_mult=4.0).effective())
    # M_Ch ~ G^-3/2 -> factor 4^-1.5 = 1/8
    assert math.isclose(g4 / base, 4.0 ** -1.5, rel_tol=1e-6)


# --- Stellar lifetimes --------------------------------------------------
def test_stronger_gravity_shortens_stellar_lifetimes():
    base = stars.stellar_profile(baseline().effective()).typical_lifetime_gyr
    strong = stars.stellar_profile(UniverseParameters(G_mult=10).effective()).typical_lifetime_gyr
    assert strong < base


def test_no_stars_in_four_dimensions():
    prof = stars.stellar_profile(UniverseParameters(dimensions=4).effective())
    assert not prof.stars_possible


# --- Nucleosynthesis ----------------------------------------------------
def test_baseline_helium_fraction_is_realistic():
    bbn = nucleosynthesis.primordial_abundances(baseline().effective())
    # Observed primordial Y_p ~ 0.24-0.25; allow a generous model band.
    assert 0.15 < bbn.helium_fraction < 0.45


def test_stronger_gravity_raises_helium_fraction():
    base = nucleosynthesis.primordial_abundances(baseline().effective()).helium_fraction
    strong = nucleosynthesis.primordial_abundances(UniverseParameters(G_mult=5).effective()).helium_fraction
    assert strong > base  # faster expansion freezes more neutrons


# --- Chemistry ----------------------------------------------------------
def test_larger_alpha_reduces_stable_elements():
    from cosmos.physics.planets import PlanetResult
    from cosmos.physics.nucleosynthesis import primordial_abundances
    pl = PlanetResult(True, True, True, 0.5, 0.3, 3, 1, "")
    ec_base = baseline().effective()
    ec_alpha = UniverseParameters(alpha_mult=2.0).effective()
    bbn_b = primordial_abundances(ec_base)
    bbn_a = primordial_abundances(ec_alpha)
    n_base = chemistry.evaluate_chemistry(ec_base, pl, bbn_b).stable_elements
    n_alpha = chemistry.evaluate_chemistry(ec_alpha, pl, bbn_a).stable_elements
    assert n_alpha < n_base  # Z_max ~ 1/alpha


def test_cosmology_dark_energy_can_cause_runaway():
    ec = UniverseParameters(dark_energy_strength=80).effective()
    exp = cosmology.expansion_history(ec)
    assert "expansion" in exp.fate.lower() or "rip" in exp.fate.lower()


def test_high_density_can_recollapse():
    ec = UniverseParameters(
        matter_density=MatterDensity.EXTREME, dark_energy_strength=0.0,
    ).effective()
    exp = cosmology.expansion_history(ec)
    assert exp.will_recollapse
