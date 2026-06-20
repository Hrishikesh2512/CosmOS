import { useState } from "react";
import { api } from "../api/client";
import type { Diagnosis, SimulationResult } from "../types";

const SUGGESTED = [
  "Why did life fail to emerge?",
  "How can I create a life-friendly universe?",
  "Why did galaxies collapse?",
  "Summarize what happened.",
];

export function AIScientist({ result }: { result: SimulationResult }) {
  const [question, setQuestion] = useState("");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      setDiagnosis(await api.ask(q, result));
    } catch (e) {
      setDiagnosis({
        question: q, answer: (e as Error).message,
        root_causes: [], suggestions: [], confidence: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel p-4">
      <h2 className="text-lg font-semibold mb-1">🔬 AI Scientist</h2>
      <p className="text-xs text-gray-400 mb-3">
        Ask why this universe turned out the way it did.
      </p>

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 bg-cosmos-panel2 border border-cosmos-border rounded-lg px-3 py-2 text-sm"
          placeholder="Ask the AI scientist…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
        />
        <button className="btn-primary" onClick={() => ask(question)} disabled={loading}>
          {loading ? "…" : "Ask"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => { setQuestion(s); ask(s); }}
            className="chip border-cosmos-border text-gray-400 hover:text-cosmos-accent2 hover:border-cosmos-accent">
            {s}
          </button>
        ))}
      </div>

      {diagnosis && (
        <div className="bg-cosmos-panel2 rounded-lg p-3 text-sm">
          <p className="mb-2">{diagnosis.answer}</p>
          {diagnosis.root_causes.length > 0 && (
            <>
              <div className="text-xs uppercase text-gray-500 mb-1">Root causes</div>
              <ul className="list-disc list-inside text-gray-300 mb-2 space-y-0.5">
                {diagnosis.root_causes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
          {diagnosis.suggestions.length > 0 && (
            <>
              <div className="text-xs uppercase text-gray-500 mb-1">Suggestions</div>
              <ul className="list-disc list-inside text-cosmos-good space-y-0.5">
                {diagnosis.suggestions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
          <div className="text-[10px] text-gray-600 mt-2">
            confidence {(diagnosis.confidence * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}
