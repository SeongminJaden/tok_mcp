import { calculateCost } from "./data/pricing.js";
import { generateAiContextYaml, generateArchitectureMd } from "./generators/docs.js";
import type { ArchitectureDesign } from "./types/index.js";

export { designArchitecture, type DesignInput } from "./design.js";
export type { ArchitectureDesign, CostEstimate } from "./types/index.js";

export function generateArchitectureDocs(design: ArchitectureDesign) {
  const cost = calculateCost(design.meta.platform, design);
  const meta = { ...design.meta, estimatedCost: cost ? `$${cost.total}/month` : "산정 보류" };
  return {
    "ARCHITECTURE.md": generateArchitectureMd(design, cost),
    ".ai-context.yaml": generateAiContextYaml({ ...design, meta }),
  };
}
