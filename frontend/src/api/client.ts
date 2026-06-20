// Typed client for the Genesis backend API.

import type {
  UniverseParameters,
  SimulationResult,
  Diagnosis,
  Comparison,
} from "../types";

// In local dev the Vite proxy forwards /api -> http://localhost:8000.
// In a static deployment (e.g. GitHub Pages) set VITE_API_BASE at build time to
// point at a hosted backend, e.g. https://your-backend.onrender.com/api
const BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  baseline: () => http<UniverseParameters>("/baseline"),

  simulate: (params: UniverseParameters) =>
    http<{ result: SimulationResult }>("/simulate", {
      method: "POST",
      body: JSON.stringify(params),
    }).then((r) => r.result),

  whatIf: (prompt: string, baseline?: UniverseParameters) =>
    http<Comparison>("/whatif", {
      method: "POST",
      body: JSON.stringify({ prompt, baseline }),
    }),

  whatIfParams: (parameters: UniverseParameters, baseline?: UniverseParameters) =>
    http<Comparison>("/whatif", {
      method: "POST",
      body: JSON.stringify({ parameters, baseline }),
    }),

  ask: (question: string, result: SimulationResult) =>
    http<Diagnosis>("/ask", {
      method: "POST",
      body: JSON.stringify({ question, result }),
    }),

  saveUniverse: (parameters: UniverseParameters, result?: SimulationResult, id?: string) =>
    http<{ id: string; name: string; share_token: string | null }>("/universes", {
      method: "POST",
      body: JSON.stringify({ parameters, result, universe_id: id }),
    }),

  listUniverses: () =>
    http<
      { id: string; name: string; parameters: UniverseParameters; outcome: string }[]
    >("/universes"),

  getUniverse: (id: string) => http<any>(`/universes/${id}`),

  deleteUniverse: (id: string) =>
    http<{ deleted: boolean }>(`/universes/${id}`, { method: "DELETE" }),

  share: (id: string) =>
    http<{ share_token: string }>(`/universes/${id}/share`, { method: "POST" }),
};
