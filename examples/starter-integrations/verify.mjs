// Run after the five README commands. Only generated documents are read.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

const root = process.argv[2] ?? ".";
const cases = [
  ["team-board", "Next.js (Pages Router), tRPC", "server", "required", "$72.65/month", "Prisma"],
  ["nest-api", "NestJS (Express)", "server", "undecided", "산정 보류", null],
  ["fastify-api", "Fastify", "server", "none", "$34.26/month", null],
  ["express-api", "Express", "undecided", "undecided", "산정 보류", null],
  ["next-web", "Next.js (App Router)", "static", "none", "$1.25/month", null],
];
for (const [name, framework, runtime, db, estimate, orm] of cases) {
  const dir = join(root, name, "tok-architecture");
  const context = parse(await readFile(join(dir, ".ai-context.yaml"), "utf8"));
  const md = await readFile(join(dir, "ARCHITECTURE.md"), "utf8");
  assert.equal(context.project.name, name);
  assert.equal(context.starter.framework, framework);
  assert.equal(context.starter.orm, orm);
  assert.ok(context.starter.entrypoints.length);
  assert.ok(context.starter.entrypoints.every(path => md.includes(path)));
  assert.deepEqual(context.deployment, {runtime, database: db});
  assert.equal(context.estimated_cost, estimate);
  assert.equal(context.compute === null, runtime !== "server");
  assert.equal(context.database === null, db !== "required");
  if (db !== "required") assert.ok(!context.dev_guide.env_vars.includes("DATABASE_URL"));
  if (name === "fastify-api") assert.match(md, /2000명/);
  if (name === "nest-api") assert.match(md, /모델 호출/);
  console.log(`${name}: ${framework}, ${runtime}, DB=${db}, ${estimate}`);
}
