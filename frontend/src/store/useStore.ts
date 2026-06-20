// Global application state (Zustand).

import { create } from "zustand";
import type {
  UniverseParameters,
  SimulationResult,
  ViewMode,
  Comparison,
} from "../types";
import { api } from "../api/client";

export const DEFAULT_PARAMS: UniverseParameters = {
  c_mult: 1,
  G_mult: 1,
  h_mult: 1,
  e_mult: 1,
  alpha_mult: 1,
  dimensions: 3,
  matter_density: "moderate",
  dark_matter_fraction: 0.84,
  dark_energy_strength: 1,
  baryonic_fraction: null,
  name: "My Universe",
  seed: 0,
};

interface AppState {
  params: UniverseParameters;
  result: SimulationResult | null;
  loading: boolean;
  error: string | null;
  view: ViewMode;
  comparison: Comparison | null;

  setParam: <K extends keyof UniverseParameters>(
    key: K,
    value: UniverseParameters[K]
  ) => void;
  resetParams: () => void;
  setView: (v: ViewMode) => void;
  createUniverse: () => Promise<void>;
  runWhatIf: (prompt: string) => Promise<void>;
  clearComparison: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  result: null,
  loading: false,
  error: null,
  view: "universe",
  comparison: null,

  setParam: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: value } })),

  resetParams: () => set({ params: { ...DEFAULT_PARAMS } }),

  setView: (v) => set({ view: v }),

  createUniverse: async () => {
    set({ loading: true, error: null });
    try {
      const result = await api.simulate(get().params);
      set({ result, loading: false, view: "universe" });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  runWhatIf: async (prompt: string) => {
    set({ loading: true, error: null });
    try {
      const comparison = await api.whatIf(prompt, get().params);
      set({ comparison, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  clearComparison: () => set({ comparison: null }),
}));
