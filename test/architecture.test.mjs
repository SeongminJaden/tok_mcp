import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "yaml";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { designArchitecture, generateArchitectureDocs } from "../dist/index.js";

const input = { description: 'notes:"# 협업', platform: "aws", serviceType: "saas", dau: 500, monthlyBudget: 1 };

test("문서와 비용은 같은 설계에서 만들어지고 YAML 문자열이 보존된다", () => {
  const design = designArchitecture(input);
  const files = generateArchitectureDocs(design);
  const context = parse(files[".ai-context.yaml"]);
  assert.equal(context.project.name, 'notes:"#');
  assert.equal(context.estimated_cost, design.meta.estimatedCost);
  assert.match(files["ARCHITECTURE.md"], /AWS SaaS Lens/);
  assert.match(files["ARCHITECTURE.md"], /월 예산 초과/);
  assert.match(files["ARCHITECTURE.md"], /2026-11-26/);
  assert.equal(context.status, "proposed");
});

test("제공자 및 실행 환경별 차이를 반영한다", () => {
  const local = designArchitecture({ ...input, platform: "on-premise" });
  assert.equal(local.meta.estimatedCost, "산정 보류");
  const gcp = designArchitecture({ ...input, platform: "gcp" });
  assert.equal(gcp.compute.cpuArch, "x86_64");
  assert.ok(!gcp.devGuide.envVars.includes("AWS_REGION"));
  assert.throws(() => designArchitecture({ ...input, dau: -1 }));
});

test("stdio에서 설계 → 문서 재생성 → 같은 비용 산정", async () => {
  const client = new Client({ name: "consumer", version: "1" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ["dist/cli.js"] }));
  try {
    assert.equal((await client.listTools()).tools.length, 6);
    const result = await client.callTool({ name: "design_architecture", arguments: input });
    const { design, files } = result.structuredContent;
    const docs = await client.callTool({ name: "generate_docs", arguments: { design } });
    assert.deepEqual(docs.structuredContent.files, files);
    const estimate = await client.callTool({ name: "estimate_cost", arguments: {
      platform: input.platform, compute: { ...design.compute, instances: design.compute.minInstances },
      database: design.database.primary, cache: design.database.cache,
    } });
    assert.ok(estimate.content[0].text.includes(design.meta.estimatedCost.split("/")[0]));
    const invalid = await client.callTool({ name: "generate_docs", arguments: {} });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
  }
});

test("서울 리전별 월 추정치와 미지원 입력", async () => {
  const { calculateCost } = await import("../dist/data/pricing.js");
  const design = designArchitecture(input);
  const cost = calculateCost("aws", design);
  assert.deepEqual(cost, {
    compute: 16.58, database: 43.78, cache: 17.52, storage: 1.25,
    networking: 16.43, other: 0, total: 95.56, currency: "USD",
  });
  design.compute.cpuArch = "x86_64";
  assert.equal(calculateCost("aws", design).compute, 20.72);
  design.meta.region = "us-east-1";
  assert.equal(calculateCost("aws", design), null);
  const gcp = designArchitecture({ ...input, serviceType: "web-api", dau: 10, platform: "gcp" });
  assert.equal(calculateCost("gcp", gcp).total, 93.74);
});
