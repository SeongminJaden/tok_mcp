import { designArchitecture, generateArchitectureDocs, type DesignInput } from "../index.js";

export async function handleDesignArchitecture(args: unknown) {
  const design = designArchitecture(args as DesignInput);
  const files = generateArchitectureDocs(design);
  const result = { design, files };
  return {
    structuredContent: result,
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}
