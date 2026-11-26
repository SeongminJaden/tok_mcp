/**
 * 문서 생성기
 * ARCHITECTURE.md와 .ai-context.yaml 생성
 */

import { stringify } from "yaml";
import { costAssumptions } from "../data/pricing.js";
import { ArchitectureDesign, CostEstimate } from "../types/index.js";

/**
 * ARCHITECTURE.md 생성 (사람이 읽는 문서)
 */
export function generateArchitectureMd(
  design: ArchitectureDesign,
  cost: CostEstimate | null
): string {
  const diagram = generateDiagram(design);

  return `# 아키텍처 문서

## 개요

- **서비스**: ${design.meta.serviceName}
- **플랫폼**: ${design.meta.platform.toUpperCase()}
- **리전**: ${design.meta.region}
- **생성일**: ${design.meta.generatedAt}

---

## 아키텍처 다이어그램

\`\`\`
${diagram}
\`\`\`

---

## 구성 요소

### 컴퓨팅

| 항목 | 값 |
|------|-----|
| 서비스 | ${design.compute.service} |
| CPU 아키텍처 | ${design.compute.cpuArch} |
| 사양 | ${design.compute.cpu}, ${design.compute.memory} |
| 인스턴스 수 | ${design.compute.minInstances} ~ ${design.compute.maxInstances} |
| 오토스케일링 | ${design.compute.autoScaling.metric} ${design.compute.autoScaling.targetValue}% |

### 데이터베이스

| 항목 | 값 |
|------|-----|
| 타입 | ${design.database.primary.type} |
| 서비스 | ${design.database.primary.service} |
| 인스턴스 | ${design.database.primary.instance} |
| 스토리지 | ${design.database.primary.storage}GB |
| Multi-AZ | ${design.database.primary.multiAz ? "활성화" : "비활성화"} |

${
  design.database.cache
    ? `### 캐시

| 항목 | 값 |
|------|-----|
| 타입 | ${design.database.cache.type} |
| 서비스 | ${design.database.cache.service} |
| 인스턴스 | ${design.database.cache.instance} |
`
    : ""
}

### 네트워킹

| 항목 | 값 |
|------|-----|
| 로드밸런서 | ${design.networking.loadBalancer} |
| DNS | ${design.networking.dns} |
| SSL | ${design.networking.ssl} |

---

## 설계 결정 사항 (ADR)

${design.designDecisions
  .map(
    (d, i) => `### ${i + 1}. ${d.decision}

**이유**: ${d.reason}
`
  )
  .join("\n")}

---

## 예상 비용

${cost ? `| 항목 | 월 비용 (USD) |
|------|--------------|
| 컴퓨팅 | $${cost.compute} |
| 데이터베이스 | $${cost.database} |
| 캐시 | $${cost.cache} |
| 스토리지 | $${cost.storage} |
| 네트워킹 | $${cost.networking} |
| **합계** | **$${cost.total}** |

> ${costAssumptions}` : "구성에 대응하는 단가가 없어 추정을 보류했습니다."}

---

## 확장 전략

${design.scalingStrategy.map((s, i) => `${i + 1}. ${s}`).join("\n")}

---

## 개발 가이드

### 기술 스택

- **언어**: ${design.devGuide.language}
- **프레임워크**: ${design.devGuide.framework}
- **ORM**: ${design.devGuide.orm}

### 프로젝트 구조

\`\`\`
${design.devGuide.structure.join("\n")}
\`\`\`

### 환경 변수

\`\`\`
${design.devGuide.envVars.join("\n")}
\`\`\`

### 개발 패턴

${design.devGuide.patterns.map((p) => `- ${p}`).join("\n")}

### 제약사항

${design.devGuide.constraints.map((c) => `- ${c}`).join("\n")}

---

## 참고 자료

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Solutions Library](https://aws.amazon.com/solutions/)

---

*이 문서는 tok_mcp에 의해 자동 생성되었습니다.*
`;
}

/**
 * .ai-context.yaml 생성 (AI가 읽는 컨텍스트 파일)
 */
export function generateAiContextYaml(design: ArchitectureDesign): string {
  return stringify({
    schema_version: 2,
    status: "proposed",
    project: { name: design.meta.serviceName },
    architecture: { platform: design.meta.platform, region: design.meta.region },
    compute: design.compute,
    database: design.database,
    storage: design.storage,
    networking: design.networking,
    dev_guide: {
      language: design.devGuide.language,
      framework: design.devGuide.framework,
      orm: design.devGuide.orm,
      env_vars: design.devGuide.envVars,
      constraints: design.devGuide.constraints,
    },
    estimated_cost: design.meta.estimatedCost,
  });
}

/**
 * 아키텍처 다이어그램 생성
 */
function generateDiagram(design: ArchitectureDesign): string {
  const platform = design.meta.platform.toUpperCase();
  const compute = design.compute.service;
  const db = design.database.primary.service;
  const cache = design.database.cache?.service || "";
  const storage = design.storage.static?.service || "";
  const cdn = design.storage.static?.cdn || "";
  const lb = design.networking.loadBalancer;
  const dns = design.networking.dns;

  return `┌─────────────────────────────────────────────────────────────┐
│                     ${platform} Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    Users                                                    │
│      │                                                      │
│      ▼                                                      │
│  ${dns.padEnd(10)} ──▶ ${(cdn || "").padEnd(12)} ──▶ ${lb.toUpperCase().padEnd(6)}             │
│                                       │                     │
│                                       ▼                     │
│                            ┌──────────────────┐            │
│                            │  ${compute.padEnd(16)}│            │
│                            │  (${design.compute.cpuArch})${" ".repeat(7)}│            │
│                            │  Auto Scaling    │            │
│                            └────────┬─────────┘            │
│                                     │                      │
│               ┌─────────────────────┼────────────────┐     │
│               ▼                     ▼                ▼     │
│        ┌──────────┐          ┌──────────┐     ┌──────────┐│
│        │  ${db.padEnd(8)}│          │  ${cache.padEnd(8)}│     │  ${storage.padEnd(8)}││
│        │${design.database.primary.type.padEnd(10)}│          │  Cache   │     │ Storage ││
│        └──────────┘          └──────────┘     └──────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘`;
}
