import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  Legend,
} from "recharts";
import type { Visualization } from "../../types";

export function CivilizationView({ viz }: { viz: Visualization }) {
  const civ = viz.civilization;
  if (!civ.timeline_years || civ.timeline_years.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No civilizations emerged in this universe.
      </div>
    );
  }

  const data = civ.timeline_years.map((y, i) => ({
    year: Math.round(y),
    tech: civ.tech[i],
    population: civ.population[i] / 1e6,
    expansion: civ.expansion[i] * 10,
  }));

  return (
    <div className="h-full p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-1">Civilization Trajectory</h3>
      <p className="text-sm text-gray-400 mb-4">
        Technology (Kardashev-scaled), population (millions) and colonization over
        one million years of history.
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#23294a" />
            <XAxis dataKey="year" stroke="#8893b8" tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis stroke="#8893b8" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#0c0f1f", border: "1px solid #23294a" }}
              labelFormatter={(v) => `Year ${Number(v).toLocaleString()}`}
            />
            <Legend />
            <Line type="monotone" dataKey="tech" stroke="#7c5cff" name="Tech level (0-10)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="expansion" stroke="#34d3ff" name="Colonization (×10%)" dot={false} strokeWidth={2} />
            {civ.extinction_events.map((e, i) => (
              <ReferenceDot key={i} x={Math.round(e.year)} y={e.tech_level}
                r={4 + e.severity * 4} fill="#ff5d6c" stroke="none" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {civ.extinction_events.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-cosmos-bad mb-2">
            Extinction Events ({civ.extinction_events.length})
          </h4>
          <ul className="space-y-1 text-sm">
            {civ.extinction_events.map((e, i) => (
              <li key={i} className="flex justify-between border-b border-cosmos-border/50 py-1">
                <span className="capitalize">{e.cause}</span>
                <span className="text-gray-400">
                  yr {Math.round(e.year).toLocaleString()} · severity{" "}
                  <span className={e.severity > 0.8 ? "text-cosmos-bad" : "text-cosmos-star"}>
                    {(e.severity * 100).toFixed(0)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
