import type { TimelineEvent } from "../types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="panel p-4">
      <h2 className="text-lg font-semibold mb-3">Cosmic Timeline</h2>
      <ol className="relative border-l border-cosmos-border ml-2">
        {events.map((e, i) => (
          <li key={i} className="mb-4 ml-4">
            <div className="absolute w-3 h-3 bg-cosmos-accent rounded-full -left-1.5 border border-cosmos-bg" />
            <time className="text-xs font-mono text-cosmos-star">{e.time_label}</time>
            <h3 className="text-sm font-medium">{e.title}</h3>
            <p className="text-xs text-gray-400">{e.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
