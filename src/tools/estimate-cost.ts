/**
 * estimate_cost 도구 핸들러
 * 아키텍처 구성에 대한 월간 비용 계산
 */

import { Platform } from "../types/index.js";
import { calculateCost, costAssumptions } from "../data/pricing.js";

interface CostInput {
  platform: Platform;
  compute: {
    service: string;
    cpuArch?: string;
    instances: number;
    cpu: string;
    memory: string;
  };
  database: {
    type: string;
    instance: string;
    storage: number;
  };
  cache?: {
    type: string;
    instance: string;
  };
}

export async function handleEstimateCost(args: unknown) {
  const input = args as CostInput;

  if (!input.platform || !input.compute || !input.database) {
    return {
      content: [
        {
          type: "text",
          text: `필수 입력값이 누락되었습니다.

필수 항목:
- platform: 클라우드 플랫폼 (aws, gcp, naver-cloud)
- compute: 컴퓨팅 구성
  - service: 서비스 (ecs-fargate, eks, ec2 등)
  - instances: 인스턴스 수
  - cpu: CPU 사양 (0.5vCPU, 1vCPU 등)
  - memory: 메모리 (1GB, 2GB 등)
- database: 데이터베이스 구성
  - type: 타입 (postgresql, mysql 등)
  - instance: 인스턴스 타입 (db.t4g.micro 등)
  - storage: 스토리지 GB`,
        },
      ],
    };
  }

  const cost = calculateCost(input.platform, {
    compute: { ...input.compute, minInstances: input.compute.instances },
    database: { primary: input.database, cache: input.cache },
  });
  if (!cost) return { content: [{ type: "text", text: "이 구성은 서울 단가표의 지원 범위를 벗어납니다. 가격 기준과 지원 SKU는 PRICING.md를 확인하세요." }] };

  return {
    content: [
      {
        type: "text",
        text: `## 월간 비용 추정

### 플랫폼: ${input.platform.toUpperCase()}

---

### 비용 상세

| 항목 | 구성 | 월 비용 |
|------|------|---------|
| **컴퓨팅** | ${input.compute.service} (${input.compute.instances}x ${input.compute.cpu}, ${input.compute.memory}) | $${cost.compute} |
| **데이터베이스** | ${input.database.type} (${input.database.instance}, ${input.database.storage}GB) | $${cost.database} |
${input.cache ? `| **캐시** | ${input.cache.type} (${input.cache.instance}) | $${cost.cache} |` : ""}
| **네트워킹** | 로드밸런서 기본료 | $${cost.networking} |
| **스토리지** | S3/GCS 등 | $${cost.storage} |
| **합계** | | **$${cost.total}** |

---

${costAssumptions}`,
      },
    ],
  };
}
