import { mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderStarterDocs } from "./integration.mjs";

const [starter, directory, dau, budget, ...rest] = process.argv.slice(2);
if (!directory || !dau || !budget || rest.length) {
  throw new Error("Usage: node run.mjs <t3|nest|fastify|express|next> <project-dir> <DAU> <monthly-USD>");
}
const project = resolve(directory);
// These are explicit example scenarios, independent of framework detection.
const scenarios = {
  t3: { platform: "aws", runtime: "server", database: "required" },
  nest: { platform: "gcp", runtime: "server", database: "undecided", needsAI: true },
  fastify: { platform: "aws", runtime: "server", database: "none", needsRealtime: true, peakConcurrent: 2000 },
  express: { platform: "undecided", runtime: "undecided", database: "undecided" },
  next: { platform: "aws", runtime: "static", database: "none" },
};
const files = await renderStarterDocs(starter, project, {
  ...scenarios[starter],
  serviceType: "web-api", dau: Number(dau), monthlyBudget: Number(budget),
});
const output = join(project, "tok-architecture");
// Claim a new directory so repeat runs cannot overwrite a maintainer's edits.
await mkdir(output);
const written = [];
try {
  for (const [name, body] of Object.entries(files)) {
    const file = join(output, name);
    await writeFile(file, body, { flag: "wx" });
    written.push(file);
  }
} catch (error) {
  for (const file of written) await unlink(file);
  await rmdir(output);
  throw error;
}
console.log(output);
