import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [project, dau, budget] = process.argv.slice(2);
if (!project || !Number.isSafeInteger(Number(dau)) || Number(dau) < 0 ||
    !Number.isFinite(Number(budget)) || Number(budget) < 0) {
  throw new Error("Usage: node create.mjs <new-project> <DAU> <monthly-USD>");
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(project) || existsSync(project)) {
  throw new Error("Choose a new, lowercase project directory name.");
}
// create-t3-app 7.40.0 exposes the same file as its ESM entry and CLI bin.
const cli = fileURLToPath(import.meta.resolve("create-t3-app"));
function run(script, args) {
  const child = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", env: { ...process.env, CI: "1" } });
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error(`Generator step failed: ${child.signal ?? child.status}`);
}
run(cli, [project, "--CI", "--prisma", "true", "--trpc", "true", "--dbProvider", "postgres", "--noInstall", "--noGit"]);
run(fileURLToPath(new URL("../run.mjs", import.meta.url)), ["t3", project, dau, budget]);
