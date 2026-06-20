import { useStore } from "../store/useStore";
import { Slider } from "./Slider";
import type { MatterDensity } from "../types";

const DENSITIES: { value: MatterDensity; label: string }[] = [
  { value: "near_empty", label: "Near Empty" },
  { value: "sparse", label: "Sparse" },
  { value: "moderate", label: "Moderate" },
  { value: "dense", label: "Dense" },
  { value: "extreme", label: "Extreme" },
];

const fmtMult = (v: number) =>
  v >= 1 ? `${v % 1 === 0 ? v : v.toFixed(1)}x` : `1/${(1 / v).toFixed(1)}x`;

export function ControlPanel() {
  const { params, setParam, resetParams, createUniverse, loading } = useStore();

  return (
    <div className="panel p-4 flex flex-col gap-2 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Universe Parameters</h2>
        <button className="text-xs text-gray-400 hover:text-white" onClick={resetParams}>
          reset
        </button>
      </div>

      <input
        className="bg-cosmos-panel2 border border-cosmos-border rounded-lg px-3 py-2 text-sm"
        value={params.name}
        onChange={(e) => setParam("name", e.target.value)}
        placeholder="Universe name"
      />

      <section>
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mt-3 mb-2">
          Fundamental Constants
        </h3>
        <Slider label="Speed of Light" symbol="c" value={params.c_mult}
          min={0.01} max={100} step={0.01} logarithmic format={fmtMult}
          onChange={(v) => setParam("c_mult", v)} />
        <Slider label="Gravitational Constant" symbol="G" value={params.G_mult}
          min={0.01} max={1000} step={0.01} logarithmic format={fmtMult}
          onChange={(v) => setParam("G_mult", v)} />
        <Slider label="Planck Constant" symbol="h" value={params.h_mult}
          min={0.1} max={10} step={0.01} logarithmic format={fmtMult}
          onChange={(v) => setParam("h_mult", v)} />
        <Slider label="Elementary Charge" symbol="e" value={params.e_mult}
          min={0.1} max={10} step={0.01} logarithmic format={fmtMult}
          onChange={(v) => setParam("e_mult", v)} />
        <Slider label="Fine-Structure Constant" symbol="α" value={params.alpha_mult}
          min={0.1} max={10} step={0.01} logarithmic format={fmtMult}
          onChange={(v) => setParam("alpha_mult", v)} />
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mt-3 mb-2">
          Cosmological Parameters
        </h3>

        <label className="text-sm text-cosmos-accent2">Spatial Dimensions</label>
        <div className="flex gap-1 my-2">
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              onClick={() => setParam("dimensions", d)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-mono border transition-colors ${
                params.dimensions === d
                  ? "bg-cosmos-accent border-cosmos-accent text-white"
                  : "bg-cosmos-panel2 border-cosmos-border text-gray-400 hover:text-white"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>

        <label className="text-sm text-cosmos-accent2">Initial Matter Density</label>
        <select
          className="w-full bg-cosmos-panel2 border border-cosmos-border rounded-lg px-3 py-2 text-sm my-2"
          value={params.matter_density}
          onChange={(e) => setParam("matter_density", e.target.value as MatterDensity)}
        >
          {DENSITIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <Slider label="Dark Matter Fraction" value={params.dark_matter_fraction}
          min={0} max={0.9} step={0.01} format={(v) => `${(v * 100).toFixed(0)}%`}
          onChange={(v) => setParam("dark_matter_fraction", v)} />
        <Slider label="Dark Energy Strength" value={params.dark_energy_strength}
          min={0} max={100} step={0.5} format={fmtMult}
          onChange={(v) => setParam("dark_energy_strength", v)} />
      </section>

      <button
        className="btn-primary mt-3 text-base py-3 shadow-lg shadow-cosmos-accent/30"
        onClick={createUniverse}
        disabled={loading}
      >
        {loading ? "Simulating…" : "✦ Create Universe"}
      </button>
      <p className="text-[11px] text-gray-500 text-center">
        Baseline = our universe (all multipliers 1×, 3D).
      </p>
    </div>
  );
}
