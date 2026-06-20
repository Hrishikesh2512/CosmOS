// Shared types mirroring the CosmOS backend API.

export type MatterDensity =
  | "near_empty"
  | "sparse"
  | "moderate"
  | "dense"
  | "extreme";

export interface UniverseParameters {
  c_mult: number;
  G_mult: number;
  h_mult: number;
  e_mult: number;
  alpha_mult: number;
  dimensions: number;
  matter_density: MatterDensity;
  dark_matter_fraction: number;
  dark_energy_strength: number;
  baryonic_fraction: number | null;
  name: string;
  seed: number;
}

export interface StageResult {
  index: number;
  name: string;
  success: boolean;
  summary: string;
  data: Record<string, any>;
}

export interface TimelineEvent {
  time_years: number;
  time_label: string;
  title: string;
  description: string;
  stage: number;
}

export interface Scorecard {
  universe_id: string;
  number: number;
  stars: boolean;
  galaxies: boolean;
  planets: boolean;
  chemistry: boolean;
  life: boolean;
  intelligence: boolean;
  civilizations: boolean;
  outcome: string;
  habitability_index: number;
  highlights: string[];
}

export interface VizPlanet {
  semi_major_au: number;
  radius_earth: number;
  is_rocky: boolean;
  in_habitable_zone: boolean;
}

export interface Visualization {
  universe: {
    galaxies: number[][];
    brightness: number[];
    expansion_rate: number;
    count: number;
  };
  galaxy: {
    stars: number[][];
    masses: number[];
    count: number;
  };
  solar_system: {
    planets: VizPlanet[];
    habitable_zone_au: number;
  };
  civilization: {
    timeline_years: number[];
    population: number[];
    tech: number[];
    expansion: number[];
    extinction_events: {
      year: number;
      severity: number;
      tech_level: number;
      cause: string;
    }[];
  };
}

export interface SimulationResult {
  universe_id: string;
  parameters: UniverseParameters;
  effective_constants: Record<string, number>;
  dimensional_profile: {
    dimensions: number;
    force_exponent: number;
    stable_orbits: boolean;
    stable_atoms: boolean;
    structure_factor: number;
    description: string;
  };
  stages: StageResult[];
  timeline: TimelineEvent[];
  scorecard: Scorecard;
  visualization: Visualization;
  compute_time_ms: number;
}

export interface Diagnosis {
  question: string;
  answer: string;
  root_causes: string[];
  suggestions: string[];
  confidence: number;
}

export interface Comparison {
  baseline_id: string;
  candidate_id: string;
  baseline_outcome: string;
  candidate_outcome: string;
  milestone_diffs: {
    milestone: string;
    baseline: boolean;
    candidate: boolean;
    change: "gained" | "lost";
  }[];
  habitability_delta: number;
  narrative: string;
  candidate: SimulationResult;
  baseline: SimulationResult;
}

export type ViewMode = "universe" | "galaxy" | "solar" | "civilization";
