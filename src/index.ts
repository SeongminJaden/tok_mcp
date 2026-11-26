import { estimatePlanCost } from "./data/pricing.js";
import { generateAiContextYaml, generateArchitectureMd } from "./generators/docs.js";
import type { ArchitecturePlan } from "./types/index.js";

export { designArchitecture, type DesignInput } from "./design.js";
export type { ArchitectureDesign, ArchitecturePlan, StarterFacts, DatabaseChoice, Runtime, CostEstimate } from "./types/index.js";

export function generateArchitectureDocs(design: ArchitecturePlan) {
  const cost = estimatePlanCost(design);
  const meta = { ...design.meta, estimatedCost: cost ? `$${cost.total}/month` : "산정 보류" };
  return {
    "ARCHITECTURE.md": generateArchitectureMd(design, cost),
    ".ai-context.yaml": generateAiContextYaml({ ...design, meta }),
  };
}
