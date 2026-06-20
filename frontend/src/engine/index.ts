// CosmOS browser engine: a full TypeScript port of the Python simulation
// engine so the app runs entirely client-side (e.g. on GitHub Pages) with no
// backend. The physics mirrors backend/cosmos and is normalized so the
// baseline universe reproduces our own.

export { simulate } from "./simulator";
export { baseline, effective } from "./parameters";
export { compare, parseWhatIf } from "./whatif";
export { AIScientist } from "./aiScientist";
export { resetCounter } from "./scorecard";
