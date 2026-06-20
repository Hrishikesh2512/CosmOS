// Client facade for the Genesis engine.
//
// The simulation runs entirely in the browser (see src/engine), so the app is a
// fully static site that works on GitHub Pages with no backend. Saved universes
// are persisted in localStorage. The method surface matches the original HTTP
// client so the UI components are unchanged.
//
// If you prefer a hosted Python backend instead, set VITE_API_BASE at build
// time and swap these implementations for fetch() calls to that API.

import type {
  UniverseParameters,
  SimulationResult,
  Diagnosis,
  Comparison,
} from "../types";
import { simulate, baseline, parseWhatIf, compare, AIScientist } from "../engine";

const STORE_KEY = "genesis.universes";

interface StoredUniverse {
  id: string;
  name: string;
  parameters: UniverseParameters;
  result: SimulationResult | null;
  created_at: string;
  updated_at: string;
  share_token: string | null;
}

function readStore(): Record<string, StoredUniverse> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, StoredUniverse>): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 14);
}

// Yield to the event loop so the "Simulating…" state can paint before the
// (fast, synchronous) computation runs.
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

export const api = {
  baseline: async (): Promise<UniverseParameters> => baseline(),

  simulate: async (params: UniverseParameters): Promise<SimulationResult> => {
    await tick();
    return simulate(params);
  },

  whatIf: async (prompt: string, base?: UniverseParameters): Promise<Comparison> => {
    await tick();
    const candidate = parseWhatIf(prompt, base);
    return compare(candidate, base);
  },

  whatIfParams: async (parameters: UniverseParameters, base?: UniverseParameters): Promise<Comparison> => {
    await tick();
    return compare(parameters, base);
  },

  ask: async (question: string, result: SimulationResult): Promise<Diagnosis> => {
    return new AIScientist(result).ask(question);
  },

  saveUniverse: async (
    parameters: UniverseParameters,
    result?: SimulationResult,
    id?: string
  ): Promise<{ id: string; name: string; share_token: string | null }> => {
    const store = readStore();
    const now = new Date().toISOString();
    const key = id ?? uid();
    const existing = store[key];
    store[key] = {
      id: key,
      name: parameters.name,
      parameters,
      result: result ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      share_token: existing?.share_token ?? null,
    };
    writeStore(store);
    return { id: key, name: parameters.name, share_token: store[key].share_token };
  },

  listUniverses: async (): Promise<
    { id: string; name: string; parameters: UniverseParameters; outcome: string }[]
  > =>
    Object.values(readStore()).map((u) => ({
      id: u.id,
      name: u.name,
      parameters: u.parameters,
      outcome: u.result?.scorecard.outcome ?? "",
    })),

  getUniverse: async (id: string): Promise<StoredUniverse> => {
    const u = readStore()[id];
    if (!u) throw new Error("Universe not found");
    return u;
  },

  deleteUniverse: async (id: string): Promise<{ deleted: boolean }> => {
    const store = readStore();
    const existed = id in store;
    delete store[id];
    writeStore(store);
    return { deleted: existed };
  },

  share: async (id: string): Promise<{ share_token: string }> => {
    const store = readStore();
    if (!store[id]) throw new Error("Universe not found");
    const token = store[id].share_token ?? uid() + uid();
    store[id].share_token = token;
    writeStore(store);
    return { share_token: token };
  },
};
