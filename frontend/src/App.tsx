import { useStore } from "./store/useStore";
import { ControlPanel } from "./components/ControlPanel";
import { Viewport } from "./components/Viewport";
import { Scorecard } from "./components/Scorecard";
import { Timeline } from "./components/Timeline";
import { AIScientist } from "./components/AIScientist";
import { WhatIfPanel } from "./components/WhatIfPanel";
import { SavePanel } from "./components/SavePanel";

export default function App() {
  const { result, error } = useStore();

  return (
    <div className="h-screen w-screen flex flex-col p-3 gap-3">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cosmos-accent to-cosmos-accent2 bg-clip-text text-transparent">
            ✦ GENESIS
          </h1>
          <span className="text-xs text-gray-500">Universe Creation & Evolution Simulator</span>
        </div>
        {result && (
          <span className="text-xs text-gray-500">
            simulated in {result.compute_time_ms.toFixed(0)} ms
          </span>
        )}
      </header>

      {error && (
        <div className="mx-2 px-4 py-2 rounded-lg bg-cosmos-bad/20 border border-cosmos-bad/40 text-sm text-cosmos-bad">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* Left: controls */}
        <div className="col-span-3 min-h-0">
          <ControlPanel />
        </div>

        {/* Center: viewport */}
        <div className="col-span-6 min-h-0">
          <Viewport />
        </div>

        {/* Right: results */}
        <div className="col-span-3 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
          {result ? (
            <>
              <Scorecard sc={result.scorecard} />
              <WhatIfPanel />
              <AIScientist result={result} />
              <Timeline events={result.timeline} />
              <SavePanel />
            </>
          ) : (
            <>
              <WhatIfPanel />
              <SavePanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
