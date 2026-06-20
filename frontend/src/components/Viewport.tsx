import { useStore } from "../store/useStore";
import type { ViewMode } from "../types";
import { UniverseView } from "./views/UniverseView";
import { GalaxyView } from "./views/GalaxyView";
import { SolarSystemView } from "./views/SolarSystemView";
import { CivilizationView } from "./views/CivilizationView";

const TABS: { id: ViewMode; label: string; icon: string }[] = [
  { id: "universe", label: "Universe", icon: "🌌" },
  { id: "galaxy", label: "Galaxy", icon: "✨" },
  { id: "solar", label: "Solar System", icon: "🪐" },
  { id: "civilization", label: "Civilization", icon: "🛰️" },
];

export function Viewport() {
  const { result, view, setView } = useStore();

  return (
    <div className="panel relative h-full overflow-hidden flex flex-col">
      <div className="flex gap-1 p-2 border-b border-cosmos-border z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === t.id
                ? "bg-cosmos-accent text-white"
                : "text-gray-400 hover:text-white hover:bg-cosmos-panel2"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 relative">
        {!result ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="text-6xl mb-4 animate-pulse">✦</div>
            <h2 className="text-2xl font-semibold mb-2">CosmOS</h2>
            <p className="text-gray-400 max-w-md">
              Adjust the fundamental laws of reality on the left, then press{" "}
              <span className="text-cosmos-accent2">Create Universe</span> to
              simulate an entire cosmos - from the Big Bang to civilizations.
            </p>
          </div>
        ) : (
          <>
            {view === "universe" && <UniverseView viz={result.visualization} />}
            {view === "galaxy" && <GalaxyView viz={result.visualization} />}
            {view === "solar" && <SolarSystemView viz={result.visualization} />}
            {view === "civilization" && <CivilizationView viz={result.visualization} />}
          </>
        )}
      </div>
    </div>
  );
}
