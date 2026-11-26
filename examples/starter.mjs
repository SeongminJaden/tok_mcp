import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { designArchitecture, generateArchitectureDocs } from "tok_mcp";

const design = designArchitecture({
  platform: "aws", serviceType: "saas", description: "TeamNotes 협업 서비스",
  dau: 500, monthlyBudget: 150,
});
const directory = process.argv[2] ?? "teamnotes";
await mkdir(directory, { recursive: true });
for (const [name, content] of Object.entries(generateArchitectureDocs(design))) {
  await writeFile(join(directory, name), content, { flag: "wx" });
}
