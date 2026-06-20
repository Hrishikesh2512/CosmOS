// AI Scientist: deterministic causal reasoning over a simulation result.
// Mirrors backend/genesis/ai/scientist.py.

import type { SimulationResult, Diagnosis, Scorecard, UniverseParameters } from "../types";

function stageData(result: SimulationResult, name: string): Record<string, any> {
  const s = result.stages.find((x) => x.name === name);
  return s ? { success: s.success, summary: s.summary, ...s.data } : {};
}

function dedup(items: string[]): string[] {
  return Array.from(new Set(items));
}

export class AIScientist {
  private r: SimulationResult;
  private sc: Scorecard;
  private params: UniverseParameters;

  constructor(result: SimulationResult) {
    this.r = result;
    this.sc = result.scorecard;
    this.params = result.parameters;
  }

  ask(question: string): Diagnosis {
    const q = question.toLowerCase().trim();
    if (/life.*(fail|not|didn'?t|no)/.test(q) || (q.includes("why") && q.includes("life") && !this.sc.life))
      return this.whyNoLife();
    if (q.includes("life") && (q.includes("how") || q.includes("friendly") || q.includes("create")))
      return this.howToMakeLifeFriendly();
    if (/galax.*(collaps|fail|no|didn'?t)/.test(q) || (q.includes("galax") && !this.sc.galaxies))
      return this.whyNoGalaxies();
    if (q.includes("star") && !this.sc.stars) return this.whyNoStars();
    if (q.includes("civiliz") || q.includes("intelligen")) return this.whyCivilizationOutcome();
    return this.summarize();
  }

  whyNoLife(): Diagnosis {
    const causes: string[] = [];
    const sugg: string[] = [];
    const chem = stageData(this.r, "Chemistry");
    const planet = stageData(this.r, "Planet Formation");
    const lifest = stageData(this.r, "Life Emergence");
    const big = stageData(this.r, "Big Bang");

    if (!this.sc.stars) {
      causes.push("No stars formed, so there was no energy source or heavy-element factory.");
      sugg.push("Reduce gravity (G) toward baseline and keep 3 spatial dimensions so stable stars can ignite.");
    }
    if (!this.sc.galaxies) {
      causes.push("Structure never assembled, leaving matter too diffuse to make stars.");
      sugg.push("Increase dark matter fraction and matter density to seed gravitational collapse.");
    }
    if (!planet.rocky_worlds) {
      causes.push("No rocky planets: " + (planet.note ?? "insufficient heavy elements."));
      sugg.push("Ensure supernova-capable stars (allow massive stars) to seed metals.");
    }
    if (Object.keys(chem).length && !chem.carbon_chemistry) {
      causes.push("Carbon/organic chemistry was unavailable: " + (chem.note ?? ""));
      sugg.push("Keep the fine-structure constant (alpha) within ~25% of baseline for stable bonds.");
    }
    if (Object.keys(lifest).length && (lifest.time_available_gyr ?? 0) < 1) {
      causes.push("Too little time: stars or the universe ended before biogenesis.");
      if (big.will_recollapse) sugg.push("Lower matter density or raise dark-energy strength slightly to avoid an early Big Crunch.");
      sugg.push("Reduce G so stars live longer (lifetime scales ~1/G).");
    }
    if (!causes.length) {
      causes.push("Prerequisites were marginal; biogenesis probability stayed below threshold.");
      sugg.push("Tune toward baseline constants and a moderate, dark-matter-rich, 3D universe.");
    }

    return {
      question: "Why did life fail to emerge?",
      answer: "Life did not emerge because the causal chain broke before biology was possible. " + causes.join(" "),
      root_causes: causes, suggestions: dedup(sugg), confidence: 0.85,
    };
  }

  whyNoGalaxies(): Diagnosis {
    const struct = stageData(this.r, "Structure Formation");
    const big = stageData(this.r, "Big Bang");
    const causes: string[] = [];
    const sugg: string[] = [];
    const dims = this.params.dimensions;
    if (dims !== 3) {
      causes.push(`In ${dims}D space, stable bound gravitational structures cannot form.`);
      sugg.push("Set spatial dimensions to 3.");
    }
    if (big.will_recollapse && (big.recollapse_time_gyr ?? 99) < 2) {
      causes.push("The universe recollapsed before structure could grow.");
      sugg.push("Lower matter density to avoid premature recollapse.");
    }
    if (this.params.dark_energy_strength > 10) {
      causes.push("Dark energy was so strong it tore matter apart before it could cluster.");
      sugg.push("Reduce dark-energy strength below ~5x.");
    }
    if ((struct.dark_matter_scaffold ?? 1) < 0.4) {
      causes.push("Too little dark matter: baryonic perturbations were washed out, slowing collapse.");
      sugg.push("Increase the dark-matter fraction (e.g. 0.7-0.85).");
    }
    if (!causes.length) {
      causes.push("Matter density was too low for gravity to overcome expansion.");
      sugg.push("Increase initial matter density.");
    }
    return {
      question: "Why did galaxies fail to form?",
      answer: "Galaxies require gravity to win over expansion within a stable 3D geometry. " + causes.join(" "),
      root_causes: causes, suggestions: dedup(sugg), confidence: 0.85,
    };
  }

  whyNoStars(): Diagnosis {
    const star = stageData(this.r, "Star Formation");
    const causes: string[] = [];
    const sugg: string[] = [];
    const dims = this.params.dimensions;
    if (dims !== 3) {
      causes.push(`${dims}D gravity has no stable hydrostatic equilibrium, so stars cannot hold together.`);
      sugg.push("Use 3 spatial dimensions.");
    }
    if ((star.mass_window_width ?? 1) <= 0.01) {
      causes.push("The stable stellar mass window collapsed under the chosen constants.");
      sugg.push("Move G, hbar and c multipliers back toward 1 to restore the Chandrasekhar balance.");
    }
    if (!this.sc.galaxies) {
      causes.push("No gas structures existed to collapse into stars.");
      sugg.push("First fix structure formation (more matter / dark matter).");
    }
    if (!causes.length) causes.push("Star formation was suppressed by the upstream conditions.");
    return {
      question: "Why did stars fail to form?",
      answer: "Stars need a stable mass window and collapsing gas. " + causes.join(" "),
      root_causes: causes, suggestions: dedup(sugg), confidence: 0.8,
    };
  }

  whyCivilizationOutcome(): Diagnosis {
    const civ = stageData(this.r, "Civilization Emergence");
    const events = civ.extinction_events ?? [];
    const causes: string[] = [];
    if (this.sc.civilizations) {
      causes.push(civ.outcome ?? "");
      if (events.length) {
        const worst = events.reduce((a: any, b: any) => (b.severity > a.severity ? b : a));
        causes.push(`Most severe extinction risk: ${worst.cause} (severity ${worst.severity.toFixed(2)}).`);
      }
    } else if (this.sc.life) {
      causes.push("Life existed but never crossed the intelligence threshold (too little time or complexity).");
    } else {
      return this.whyNoLife();
    }
    return {
      question: "What happened to civilizations?",
      answer: "Civilization trajectory: " + causes.filter(Boolean).join(" "),
      root_causes: causes, suggestions: [], confidence: 0.75,
    };
  }

  howToMakeLifeFriendly(): Diagnosis {
    const sugg = [
      "Spatial dimensions = 3 (the only setting with both stable orbits and stable atoms).",
      "Keep G within ~0.5-2x baseline: too strong shortens stellar lifetimes and shrinks the mass window.",
      "Keep the fine-structure constant alpha within ~25% of baseline for stable chemistry and bonds.",
      "Use a moderate-to-dense matter density with a high dark-matter fraction (~0.8) to build galaxies quickly.",
      "Keep dark-energy strength near 1x so structure has time to form but the universe doesn't recollapse.",
      "Allow massive stars (supernovae) so heavy elements seed rocky, water-bearing planets.",
    ];
    const notes: string[] = [];
    const p = this.params;
    if (p.dimensions !== 3) notes.push(`Currently ${p.dimensions}D - this alone prevents life.`);
    if (!(p.G_mult >= 0.5 && p.G_mult <= 2)) notes.push(`G is ${p.G_mult}x baseline.`);
    if (!(p.alpha_mult >= 0.75 && p.alpha_mult <= 1.25)) notes.push(`alpha is ${p.alpha_mult}x baseline.`);
    let answer = "To build a life-friendly universe, aim for conditions like our own where the causal chain stays intact:";
    if (notes.length) answer += " Your current settings to revisit: " + notes.join("; ");
    return { question: "How can I create a life-friendly universe?", answer, root_causes: notes, suggestions: sugg, confidence: 0.9 };
  }

  summarize(): Diagnosis {
    const sc = this.sc;
    const milestones: [string, boolean][] = [
      ["galaxies", sc.galaxies], ["stars", sc.stars], ["planets", sc.planets],
      ["chemistry", sc.chemistry], ["life", sc.life],
      ["intelligence", sc.intelligence], ["civilizations", sc.civilizations],
    ];
    const achieved = milestones.filter(([, ok]) => ok).map(([m]) => m);
    const failedAt = milestones.find(([, ok]) => !ok)?.[0];
    let ans = `${sc.outcome} Habitability index ${sc.habitability_index.toFixed(2)}. `;
    if (achieved.length) ans += "Achieved: " + achieved.join(", ") + ". ";
    if (failedAt) ans += `The chain first broke at: ${failedAt}.`;
    return { question: "Summary", answer: ans, root_causes: sc.highlights, suggestions: [], confidence: 0.95 };
  }
}
