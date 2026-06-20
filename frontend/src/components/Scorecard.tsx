import type { Scorecard as ScorecardType } from "../types";

const MILESTONES: { key: keyof ScorecardType; label: string }[] = [
  { key: "galaxies", label: "Galaxies" },
  { key: "stars", label: "Stars" },
  { key: "planets", label: "Planets" },
  { key: "chemistry", label: "Chemistry" },
  { key: "life", label: "Life" },
  { key: "intelligence", label: "Intelligence" },
  { key: "civilizations", label: "Civilizations" },
];

export function Scorecard({ sc }: { sc: ScorecardType }) {
  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">
          Universe #{sc.number}
        </h2>
        <span className="text-sm text-gray-400">
          habitability {(sc.habitability_index * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {MILESTONES.map((m) => {
          const ok = sc[m.key] as boolean;
          return (
            <div key={m.key} className="flex items-center justify-between bg-cosmos-panel2 rounded-lg px-3 py-1.5">
              <span className="text-sm">{m.label}</span>
              <span className={ok ? "text-cosmos-good" : "text-cosmos-bad"}>
                {ok ? "✓" : "✕"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-cosmos-accent/10 border border-cosmos-accent/30 px-3 py-2">
        <div className="text-xs text-gray-400">Outcome</div>
        <div className="text-sm font-medium text-cosmos-accent2">{sc.outcome}</div>
      </div>

      {sc.highlights.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-gray-400">
          {sc.highlights.map((h, i) => (
            <li key={i}>· {h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
