import { generateArchitectureDocs, type ArchitecturePlan } from "../index.js";

export async function handleGenerateDocs(args: unknown) {
  const { design, outputPath = "." } = args as { design: ArchitecturePlan; outputPath?: string };
  const files = generateArchitectureDocs(design);
  return {
    structuredContent: { files },
    content: [
      { type: "text", text: JSON.stringify({ files }) },
      { type: "text", text: `문서 본문을 준비했습니다. 저장할 디렉터리: ${outputPath}` },
    ],
  };
}
