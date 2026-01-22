/**
 * design_architecture 도구 핸들러
 * 대화형 질문을 통해 아키텍처를 설계합니다.
 */

import {
  Platform,
  ServiceType,
  UserRequirements,
  ArchitectureDesign,
} from "../types/index.js";
import { getArchitecturePattern } from "../data/patterns.js";
import { recommendCpuArchitecture } from "../data/cpu-arch.js";
import { calculateCost } from "../data/pricing.js";
import { generateArchitectureMd, generateAiContextYaml } from "../generators/docs.js";

interface DesignInput {
  platform: Platform;
  serviceType: ServiceType;
  description: string;
  dau: number;
  peakConcurrent?: number;
  monthlyBudget: number;
  needsRealtime?: boolean;
  needsFileUpload?: boolean;
  needsAI?: boolean;
  isGlobal?: boolean;
  growthRate?: number;
}

export async function handleDesignArchitecture(args: unknown) {
  const input = args as DesignInput;

  // 입력 검증
  if (!input.platform || !input.serviceType || !input.description || !input.dau || !input.monthlyBudget) {
    return {
      content: [
        {
          type: "text",
          text: `필수 입력값이 누락되었습니다.

필수 항목:
- platform: 클라우드 플랫폼 (aws, gcp, naver-cloud, on-premise)
- serviceType: 서비스 유형 (web-api, saas, game, messenger, ai-ml, media, iot, ecommerce, other)
- description: 서비스 설명
- dau: 예상 일일 활성 사용자 수
- monthlyBudget: 월 예산 (USD)

예시:
{
  "platform": "aws",
  "serviceType": "saas",
  "description": "B2B 문서 협업 서비스",
  "dau": 500,
  "monthlyBudget": 100
}`,
        },
      ],
    };
  }

  // 규모 결정
  const scale = determineScale(input.dau);

  // 아키텍처 패턴 조회
  const pattern = getArchitecturePattern(input.platform, input.serviceType, scale);

  // CPU 아키텍처 추천
  const cpuArch = recommendCpuArchitecture(
    input.serviceType === "ai-ml" ? "ml-inference" : "web-api",
    input.platform
  );

  // 아키텍처 설계 생성
  const design = buildArchitectureDesign(input, pattern, cpuArch);

  // 비용 계산
  const cost = calculateCost(input.platform, design);

  // 문서 생성
  const architectureMd = generateArchitectureMd(design, cost);
  const aiContextYaml = generateAiContextYaml(design);

  return {
    content: [
      {
        type: "text",
        text: `## 아키텍처 설계 완료

### 핵심 구성
- **플랫폼**: ${input.platform.toUpperCase()}
- **컴퓨팅**: ${design.compute.service} (${cpuArch.architecture})
- **데이터베이스**: ${design.database.primary.type} (${design.database.primary.service})
${design.database.cache ? `- **캐시**: ${design.database.cache.type} (${design.database.cache.service})` : ""}
- **스토리지**: ${design.storage.static?.service || "N/A"}
- **예상 월 비용**: $${cost.total}

### 설계 결정 사항
${design.designDecisions.map((d) => `- **${d.decision}**: ${d.reason}`).join("\n")}

---

## 생성된 문서

### 📄 ARCHITECTURE.md (사람용)

\`\`\`markdown
${architectureMd}
\`\`\`

---

### 🤖 .ai-context.yaml (AI용)

\`\`\`yaml
${aiContextYaml}
\`\`\`

---

**다음 단계**: 위 문서들을 프로젝트 루트에 저장하세요.
그 후 AI에게 ".ai-context.yaml 참고해서 API 서버 만들어줘"라고 하면 아키텍처에 맞게 개발됩니다.`,
      },
    ],
  };
}

function determineScale(dau: number): "mvp" | "small" | "medium" | "large" | "enterprise" {
  if (dau < 100) return "mvp";
  if (dau < 1000) return "small";
  if (dau < 10000) return "medium";
  if (dau < 100000) return "large";
  return "enterprise";
}

function buildArchitectureDesign(
  input: DesignInput,
  pattern: ReturnType<typeof getArchitecturePattern>,
  cpuArch: ReturnType<typeof recommendCpuArchitecture>
): ArchitectureDesign {
  const now = new Date().toISOString().split("T")[0];

  return {
    meta: {
      serviceName: input.description.split(" ")[0].toLowerCase() || "my-app",
      platform: input.platform,
      region: input.platform === "aws" ? "ap-northeast-2" : "asia-northeast3",
      estimatedCost: `$${input.monthlyBudget}/month`,
      generatedAt: now,
    },
    compute: {
      service: pattern.compute.service,
      cpuArch: cpuArch.architecture,
      cpu: pattern.compute.cpu,
      memory: pattern.compute.memory,
      minInstances: pattern.compute.minInstances,
      maxInstances: pattern.compute.maxInstances,
      autoScaling: {
        metric: "cpu",
        targetValue: 70,
      },
    },
    database: {
      primary: {
        type: pattern.database.type,
        service: pattern.database.service,
        instance: pattern.database.instance,
        storage: pattern.database.storage,
        multiAz: false,
      },
      cache: pattern.cache
        ? {
            type: pattern.cache.type,
            service: pattern.cache.service,
            instance: pattern.cache.instance,
          }
        : undefined,
    },
    storage: {
      static: pattern.storage
        ? {
            service: pattern.storage.service,
            cdn: pattern.storage.cdn,
          }
        : undefined,
    },
    networking: {
      loadBalancer: pattern.networking.loadBalancer,
      dns: pattern.networking.dns,
      ssl: pattern.networking.ssl,
    },
    devGuide: {
      language: "typescript",
      framework: input.serviceType === "ai-ml" ? "fastapi" : "express",
      orm: "prisma",
      structure: [
        "src/api/ - API 엔드포인트",
        "src/services/ - 비즈니스 로직",
        "src/repositories/ - 데이터 접근",
        "src/models/ - 타입 정의",
      ],
      envVars: ["DATABASE_URL", "REDIS_URL", "AWS_REGION", "AWS_S3_BUCKET"],
      patterns: [
        "REST API with OpenAPI spec",
        "Repository pattern for data access",
        "Structured JSON logging",
        "Health check endpoint at /health",
      ],
      constraints: cpuArch.constraints,
    },
    scalingStrategy: pattern.scalingStrategy,
    designDecisions: [
      {
        decision: `${pattern.compute.service} 선택`,
        reason: pattern.compute.reason,
      },
      {
        decision: `${cpuArch.architecture} 아키텍처`,
        reason: cpuArch.reason,
      },
      {
        decision: `${pattern.database.type} 데이터베이스`,
        reason: pattern.database.reason,
      },
    ],
  };
}
