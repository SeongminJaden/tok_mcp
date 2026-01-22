/**
 * estimate_cost 도구 핸들러
 * 아키텍처 구성에 대한 월간 비용 계산
 */

import { Platform } from "../types/index.js";
import { calculateCost, getPricing } from "../data/pricing.js";

interface CostInput {
  platform: Platform;
  compute: {
    service: string;
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

  const pricing = getPricing(input.platform);
  const cost = estimateMonthlyCost(input, pricing);

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
| **네트워킹** | 로드밸런서 + 데이터 전송 | $${cost.networking} |
| **스토리지** | S3/GCS 등 | $${cost.storage} |
| **기타** | CloudWatch, DNS 등 | $${cost.other} |
| **합계** | | **$${cost.total}** |

---

### 비용 최적화 팁

${generateCostOptimizationTips(input)}

---

### 비용 비교 (ARM vs x86)

| 아키텍처 | 예상 비용 | 절감률 |
|----------|----------|--------|
| ARM (Graviton) | $${Math.round(cost.total * 0.6)} | 40% 절감 |
| x86 (Intel/AMD) | $${cost.total} | - |

---

### 주의사항
- 실제 비용은 사용량에 따라 달라질 수 있습니다
- 데이터 전송 비용은 트래픽에 따라 크게 변동될 수 있습니다
- Reserved Instances/Savings Plans 적용 시 추가 할인 가능`,
      },
    ],
  };
}

interface CostBreakdown {
  compute: number;
  database: number;
  cache: number;
  storage: number;
  networking: number;
  other: number;
  total: number;
}

function estimateMonthlyCost(input: CostInput, pricing: ReturnType<typeof getPricing>): CostBreakdown {
  // 컴퓨팅 비용 계산
  const cpuNum = parseFloat(input.compute.cpu) || 0.5;
  const memNum = parseFloat(input.compute.memory) || 1;
  const instances = input.compute.instances || 1;

  let computeCost = 0;
  if (input.compute.service.includes("fargate")) {
    computeCost = (cpuNum * pricing.compute.fargateCpuHour + memNum * pricing.compute.fargateMemHour) * 730 * instances;
  } else {
    computeCost = pricing.compute.ec2Instances[input.compute.cpu] || 15;
    computeCost *= instances;
  }

  // 데이터베이스 비용
  const dbCost = pricing.database.rdsInstances[input.database.instance] || 15;
  const storageCost = input.database.storage * pricing.database.storagePerGB;

  // 캐시 비용
  const cacheCost = input.cache
    ? pricing.cache.elasticacheInstances[input.cache.instance] || 12
    : 0;

  // 네트워킹 비용
  const networkingCost = pricing.networking.albHour * 730 + 10; // ALB + 데이터 전송 추정

  // 기타 비용
  const otherCost = 5; // CloudWatch, DNS 등

  const total = Math.round(computeCost + dbCost + storageCost + cacheCost + networkingCost + otherCost);

  return {
    compute: Math.round(computeCost),
    database: Math.round(dbCost + storageCost),
    cache: Math.round(cacheCost),
    storage: 5,
    networking: Math.round(networkingCost),
    other: otherCost,
    total,
  };
}

function generateCostOptimizationTips(input: CostInput): string {
  const tips: string[] = [];

  // ARM 추천
  if (!input.compute.service.includes("graviton") && !input.compute.cpu.includes("g")) {
    tips.push("- **ARM(Graviton) 전환**: x86 → ARM 전환 시 ~40% 비용 절감 가능");
  }

  // Fargate 추천
  if (input.compute.service === "ec2") {
    tips.push("- **Fargate 전환**: 관리 부담 감소 + 사용량 기반 과금으로 효율적");
  }

  // Reserved 추천
  tips.push("- **Reserved Instances**: 1년 약정 시 ~30% 할인, 3년 약정 시 ~50% 할인");
  tips.push("- **Savings Plans**: 유연한 약정으로 할인 혜택");

  // 캐시 추천
  if (!input.cache) {
    tips.push("- **캐시 추가**: Redis 캐시 추가 시 DB 부하 감소로 DB 비용 절감 가능");
  }

  // Spot 인스턴스
  tips.push("- **Spot Instances**: 개발/테스트 환경에 Spot 사용 시 ~90% 절감");

  return tips.join("\n");
}
