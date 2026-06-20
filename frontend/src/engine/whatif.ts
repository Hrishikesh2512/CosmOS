// What-If engine: parse prompts into parameter changes and compare universes.
// Mirrors backend/cosmos/ai/whatif.py.

import { simulate } from "./simulator";
import { baseline } from "./parameters";
import type { UniverseParameters, SimulationResult, Comparison } from "../types";

const MILESTONES = ["galaxies", "stars", "planets", "chemistry", "life", "intelligence", "civilizations"] as const;

export function compare(
  candidate: UniverseParameters, base?: UniverseParameters
): Comparison {
  const b = base ?? baseline();
  const rb = simulate(b);
  const rc = simulate(candidate);
  return buildComparison(rb, rc);
}

function buildComparison(rb: SimulationResult, rc: SimulationResult): Comparison {
  const diffs: Comparison["milestone_diffs"] = [];
  for (const m of MILESTONES) {
    const bv = rb.scorecard[m] as boolean;
    const cv = rc.scorecard[m] as boolean;
    if (bv !== cv) diffs.push({ milestone: m, baseline: bv, candidate: cv, change: cv && !bv ? "gained" : "lost" });
  }
  const lost = diffs.filter((d) => d.change === "lost").map((d) => d.milestone);
  const gained = diffs.filter((d) => d.change === "gained").map((d) => d.milestone);
  const delta = rc.scorecard.habitability_index - rb.scorecard.habitability_index;

  const parts = [`Compared to baseline (${rb.scorecard.outcome.toLowerCase()}), this universe is ${rc.scorecard.outcome.toLowerCase()}`];
  if (lost.length) parts.push(`It loses: ${lost.join(", ")}.`);
  if (gained.length) parts.push(`It gains: ${gained.join(", ")}.`);
  if (!diffs.length) parts.push("The high-level milestones are unchanged, though detailed dynamics differ.");
  parts.push(`Habitability index ${delta >= 0 ? "+" : ""}${delta.toFixed(2)} (${rb.scorecard.habitability_index.toFixed(2)} -> ${rc.scorecard.habitability_index.toFixed(2)}).`);

  return {
    baseline_id: rb.universe_id, candidate_id: rc.universe_id,
    baseline_outcome: rb.scorecard.outcome, candidate_outcome: rc.scorecard.outcome,
    milestone_diffs: diffs, habitability_delta: Math.round(delta * 1000) / 1000,
    narrative: parts.join(" "), candidate: rc, baseline: rb,
  };
}

const FACTOR = /(\d+(?:\.\d+)?)\s*x/;

export function parseWhatIf(prompt: string, base?: UniverseParameters): UniverseParameters {
  const b = base ?? baseline();
  const p: UniverseParameters = { ...b };
  const q = prompt.toLowerCase();

  const m = q.match(FACTOR);
  const f = m ? parseFloat(m[1]) : 2.0;
  const up = ["stronger", "more", "larger", "higher", "faster", "increase"].some((w) => q.includes(w));
  const down = ["weaker", "less", "smaller", "lower", "slower", "decrease"].some((w) => q.includes(w));
  const dir = up ? 1 : down ? -1 : 1;
  const val = dir > 0 ? f : 1 / f;

  if (q.includes("gravity") || /\bg\b/.test(q)) p.G_mult = val;
  if (q.includes("speed of light") || /\blight\b/.test(q) || /\bc\b/.test(q))
    p.c_mult = q.includes("slow") || dir < 0 ? 1 / f : f;
  if (q.includes("planck")) p.h_mult = val;
  if (q.includes("charge")) p.e_mult = val;
  if (q.includes("fine structure") || q.includes("alpha")) p.alpha_mult = val;
  if (q.includes("dark matter")) {
    if (q.includes("no") || q.includes("without") || q.includes("0")) p.dark_matter_fraction = 0;
    else p.dark_matter_fraction = Math.min(0.9, p.dark_matter_fraction * val);
  }
  if (q.includes("dark energy")) p.dark_energy_strength = Math.min(100, Math.max(0, dir > 0 ? f : 1 / f));
  if (q.includes("dimension")) {
    const dm = q.match(/(\d)\s*d|dimension[s]?\s*(?:of|=|:)?\s*(\d)/);
    if (dm) p.dimensions = parseInt(dm[1] ?? dm[2], 10);
    else if (q.includes("4")) p.dimensions = 4;
  }

  p.name = `What-If: ${prompt.trim().slice(0, 60)}`;
  return p;
}
