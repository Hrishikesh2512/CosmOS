import { useState } from "react";
import { useStore } from "../store/useStore";

const EXAMPLES = [
  "What if gravity was 100x stronger?",
  "What if the speed of light was 10x slower?",
  "What if space had 4 dimensions?",
  "What if dark matter did not exist?",
  "What if dark energy was 50x stronger?",
];

export function WhatIfPanel() {
  const { runWhatIf, comparison, clearComparison, loading } = useStore();
  const [prompt, setPrompt] = useState("");

  return (
    <div className="panel p-4">
      <h2 className="text-lg font-semibold mb-1">🌀 What-If Engine</h2>
      <p className="text-xs text-gray-400 mb-3">
        Compare an alternate reality against your current universe.
      </p>

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 bg-cosmos-panel2 border border-cosmos-border rounded-lg px-3 py-2 text-sm"
          placeholder="What if…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runWhatIf(prompt)}
        />
        <button className="btn-primary" onClick={() => runWhatIf(prompt)} disabled={loading}>
          {loading ? "…" : "Run"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => { setPrompt(e); runWhatIf(e); }}
            className="chip border-cosmos-border text-gray-400 hover:text-cosmos-accent2 hover:border-cosmos-accent">
            {e}
          </button>
        ))}
      </div>

      {comparison && (
        <div className="bg-cosmos-panel2 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="flex-1">{comparison.narrative}</p>
            <button onClick={clearComparison} className="text-gray-500 hover:text-white ml-2">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-cosmos-bg/50 p-2">
              <div className="text-gray-500">Baseline</div>
              <div>{comparison.baseline_outcome}</div>
            </div>
            <div className="rounded bg-cosmos-bg/50 p-2">
              <div className="text-gray-500">Candidate</div>
              <div>{comparison.candidate_outcome}</div>
            </div>
          </div>
          {comparison.milestone_diffs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comparison.milestone_diffs.map((d) => (
                <span key={d.milestone}
                  className={`chip ${d.change === "lost"
                    ? "border-cosmos-bad/50 text-cosmos-bad"
                    : "border-cosmos-good/50 text-cosmos-good"}`}>
                  {d.change === "lost" ? "−" : "+"} {d.milestone}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs mt-2 text-gray-400">
            Habitability change:{" "}
            <span className={comparison.habitability_delta >= 0 ? "text-cosmos-good" : "text-cosmos-bad"}>
              {comparison.habitability_delta >= 0 ? "+" : ""}
              {(comparison.habitability_delta * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
