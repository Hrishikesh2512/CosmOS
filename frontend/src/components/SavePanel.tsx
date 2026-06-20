import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { api } from "../api/client";

export function SavePanel() {
  const { params, result } = useStore();
  const [saved, setSaved] = useState<{ id: string; name: string }[]>([]);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const refresh = () =>
    api.listUniverses().then((u) => setSaved(u.map((x) => ({ id: x.id, name: x.name }))));

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const save = async () => {
    const su = await api.saveUniverse(params, result ?? undefined);
    setStatus(`Saved “${su.name}”`);
    refresh();
  };

  const load = async (id: string) => {
    const su = await api.getUniverse(id);
    useStore.setState({ params: { ...su.parameters }, result: su.result ?? null });
    setStatus(`Loaded “${su.name}”`);
  };

  const remove = async (id: string) => {
    await api.deleteUniverse(id);
    refresh();
  };

  const share = async (id: string) => {
    const { share_token } = await api.share(id);
    setShareToken(share_token);
  };

  const exportReport = () => {
    if (!result) return;
    const blob = new Blob([buildReport()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.scorecard.universe_id}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportScreenshot = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
    a.download = "cosmos-universe.png";
    a.click();
  };

  const buildReport = () => {
    if (!result) return "";
    const sc = result.scorecard;
    const lines = [
      `# CosmOS Universe Report - ${result.parameters.name}`,
      ``,
      `**Outcome:** ${sc.outcome}`,
      `**Habitability index:** ${(sc.habitability_index * 100).toFixed(0)}%`,
      ``,
      `## Parameters`,
      ...Object.entries(result.parameters).map(([k, v]) => `- ${k}: ${v}`),
      ``,
      `## Stages`,
      ...result.stages.map((s) => `### ${s.index}. ${s.name} - ${s.success ? "✓" : "✕"}\n${s.summary}`),
      ``,
      `## Timeline`,
      ...result.timeline.map((e) => `- **${e.time_label}** - ${e.title}: ${e.description}`),
    ];
    return lines.join("\n");
  };

  return (
    <div className="panel p-4">
      <h2 className="text-lg font-semibold mb-3">Save & Share</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <button className="btn-ghost text-sm" onClick={save}>💾 Save</button>
        <button className="btn-ghost text-sm" onClick={exportReport} disabled={!result}>📄 Export Report</button>
        <button className="btn-ghost text-sm" onClick={exportScreenshot} disabled={!result}>📷 Screenshot</button>
      </div>
      {status && <p className="text-xs text-cosmos-good mb-2">{status}</p>}
      {shareToken && (
        <p className="text-xs text-cosmos-accent2 mb-2 break-all">
          Share link: {`${location.origin}/?shared=${shareToken}`}
        </p>
      )}

      {saved.length > 0 && (
        <div>
          <div className="text-xs uppercase text-gray-500 mb-1">Saved universes</div>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {saved.map((u) => (
              <li key={u.id} className="flex items-center justify-between bg-cosmos-panel2 rounded-lg px-2 py-1 text-sm">
                <button className="truncate text-left hover:text-cosmos-accent2" onClick={() => load(u.id)}>
                  {u.name}
                </button>
                <span className="flex gap-1 ml-2">
                  <button className="text-gray-500 hover:text-cosmos-accent2" onClick={() => share(u.id)}>🔗</button>
                  <button className="text-gray-500 hover:text-cosmos-bad" onClick={() => remove(u.id)}>🗑</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
