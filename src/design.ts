import {
  Platform,
  ServiceType,
  ArchitectureDesign,
} from "./types/index.js";
import { getArchitecturePattern } from "./data/patterns.js";
import { recommendCpuArchitecture } from "./data/cpu-arch.js";
import { calculateCost } from "./data/pricing.js";


export interface DesignInput {
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

export function designArchitecture(input: DesignInput): ArchitectureDesign {
  if (!["aws", "gcp", "naver-cloud", "on-premise"].includes(input?.platform) ||
      !["web-api", "saas", "game", "messenger", "ai-ml", "media", "iot", "ecommerce", "other"].includes(input.serviceType) ||
      typeof input.description !== "string" || !input.description.trim() ||
      !Number.isSafeInteger(input.dau) || input.dau < 0 ||
      !Number.isFinite(input.monthlyBudget) || input.monthlyBudget < 0) {
    throw new TypeError("Check platform, serviceType, description, dau and monthlyBudget.");
  }
  // 규모 결정
  const scale = determineScale(input.dau);

  // 아키텍처 패턴 조회
  const pattern = getArchitecturePattern(input.platform, input.serviceType, scale);

  // CPU 아키텍처 추천
  const cpuArch = pattern.compute.service === "cloud-run" ? {
    architecture: "x86_64" as const, reason: "Cloud Run 컨테이너 런타임 ABI",
    constraints: ["이미지에 linux/amd64를 포함하세요. https://docs.cloud.google.com/run/docs/container-contract"],
    recommendedInstance: "cloud-run", costSaving: "",
  } : recommendCpuArchitecture(
    input.serviceType === "ai-ml" ? "ml-inference" : "web-api",
    input.platform
  );

  // 아키텍처 설계 생성
  const design = buildArchitectureDesign(input, pattern, cpuArch);

  const cost = calculateCost(input.platform, design);
  design.meta.estimatedCost = cost ? `$${cost.total}/month` : "산정 보류";
  if (input.platform === "aws" && input.serviceType === "saas") {
    design.designDecisions.push({
      decision: "테넌트 격리 모델 검토",
      reason: "공유 리소스(pool)는 테넌트별 접근 제어와 사용량 관측이 필요합니다. 전용 리소스 요구가 있는 고객은 silo 또는 일부 계층만 분리하는 bridge 모델을 검토하세요. [AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html)",
    });
  }
  if (cost && cost.total > input.monthlyBudget) {
    design.designDecisions.push({
      decision: "월 예산 초과 검토",
      reason: `내장 단가 추정치 $${cost.total}가 목표 예산 $${input.monthlyBudget}를 초과합니다. 최소 인스턴스 수와 캐시 필요성을 검토하세요.`,
    });
  }
  return design;
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
      serviceName: input.description.trim().split(" ")[0].toLowerCase() || "my-app",
      platform: input.platform,
      region: { aws: "ap-northeast-2", gcp: "asia-northeast3", "naver-cloud": "KR", "on-premise": "local" }[input.platform],
      estimatedCost: "산정 보류",
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
      language: input.serviceType === "ai-ml" ? "python" : "typescript",
      framework: input.serviceType === "ai-ml" ? "fastapi" : "express",
      orm: input.serviceType === "ai-ml" ? "sqlalchemy" : "prisma",
      structure: [
        "src/api/ - API 엔드포인트",
        "src/services/ - 비즈니스 로직",
        "src/repositories/ - 데이터 접근",
        "src/models/ - 타입 정의",
      ],
      envVars: ["DATABASE_URL", ...(pattern.cache ? ["REDIS_URL"] : []), ...(input.platform === "aws" ? ["AWS_REGION"] : []), ...(pattern.storage?.service === "s3" ? ["AWS_S3_BUCKET"] : [])],
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
