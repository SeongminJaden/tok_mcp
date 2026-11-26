import {
  Platform,
  ServiceType,
  ArchitectureDesign, ArchitecturePlan, Runtime, DatabaseChoice, StarterFacts,
} from "./types/index.js";
import { getArchitecturePattern } from "./data/patterns.js";
import { recommendCpuArchitecture } from "./data/cpu-arch.js";
import { estimatePlanCost } from "./data/pricing.js";


export interface DesignInput {
  platform: Platform | "undecided";
  runtime?: Runtime;
  database?: DatabaseChoice;
  starter?: StarterFacts;
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

export function designArchitecture(input: DesignInput & { platform: Platform; runtime?: "server"; database?: "required" }): ArchitectureDesign & Pick<ArchitecturePlan, "deployment" | "starter">;
export function designArchitecture(input: DesignInput): ArchitecturePlan;
export function designArchitecture(input: DesignInput): ArchitecturePlan {
  if (!["aws", "gcp", "naver-cloud", "on-premise", "undecided"].includes(input?.platform) ||
      !["web-api", "saas", "game", "messenger", "ai-ml", "media", "iot", "ecommerce", "other"].includes(input.serviceType) ||
      typeof input.description !== "string" || !input.description.trim() ||
      !Number.isSafeInteger(input.dau) || input.dau < 0 ||
      !Number.isFinite(input.monthlyBudget) || input.monthlyBudget < 0) {
    throw new TypeError("Check platform, serviceType, description, dau and monthlyBudget.");
  }
  const runtime = input.runtime ?? (input.platform === "undecided" ? "undecided" : "server");
  const database = input.database ?? (runtime === "static" ? "none" : runtime === "undecided" ? "undecided" : "required");
  validateOptions(input, runtime, database);
  const server = runtime === "server" && input.platform !== "undecided" ? serverTemplate(input, input.platform) : null;
  const design: ArchitecturePlan = server ?? {
    meta: {
      serviceName: input.description.trim().split(" ")[0].toLowerCase(),
      platform: input.platform,
      region: input.platform === "undecided" ? "미정" : regions[input.platform],
      generatedAt: new Date().toISOString().slice(0, 10), estimatedCost: "산정 보류",
    },
    compute: null, database: null, networking: null, storage: {},
    devGuide: { language: "미정", framework: "미정", orm: "미선택", structure: [], envVars: [], patterns: [], constraints: [] },
    scalingStrategy: [], designDecisions: [],
  };
  design.deployment = { runtime, database };
  if (runtime === "static") {
    const storage = { aws: "s3", gcp: "gcs", "naver-cloud": "object-storage", "on-premise": "local-storage", undecided: undefined }[input.platform];
    if (storage) design.storage.static = { service: storage };
    design.designDecisions.push({ decision: "정적 배포", reason: "빌드 결과물을 정적 호스팅에 게시합니다." });
  }
  if (server && database !== "required") {
    design.database = null;
    design.devGuide.orm = "미선택";
    design.devGuide.envVars = design.devGuide.envVars.filter(v => !["DATABASE_URL", "REDIS_URL"].includes(v));

    design.scalingStrategy = ["요청 지연과 인스턴스당 처리량을 측정해 증설 기준을 정합니다."];
  }
  if (input.starter) {
    design.starter = { ...input.starter, entrypoints: input.starter.entrypoints?.slice() };
    const facts = input.starter;
    if (facts.language !== undefined) design.devGuide.language = facts.language;
    if (facts.framework !== undefined) design.devGuide.framework = facts.framework;
    if (facts.orm !== undefined) design.devGuide.orm = facts.orm ?? "미선택";
    if (facts.entrypoints !== undefined) design.devGuide.structure = [...facts.entrypoints];
    design.devGuide.patterns = [];
  }
  applyRequirements(design, input);
  const cost = estimatePlanCost(design);
  design.meta.estimatedCost = cost ? `$${cost.total}/month` : "산정 보류";
  if (server && input.platform === "aws" && input.serviceType === "saas") {
    design.designDecisions.push({
      decision: "테넌트 격리 모델 검토",
      reason: "공유 리소스(pool)는 테넌트별 접근 제어와 사용량 관측이 필요합니다. 전용 리소스 요구가 있는 고객은 silo 또는 일부 계층만 분리하는 bridge 모델을 검토하세요. [AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html)",
    });
  }
  if (cost && cost.total > input.monthlyBudget) {
    design.designDecisions.push({
      decision: "월 예산 초과 검토",
      reason: `내장 단가 추정치 $${cost.total}가 목표 예산 $${input.monthlyBudget}를 초과합니다. ${runtime === "static" ? "저장 용량 가정을 검토하세요." : "최소 인스턴스 수와 구성별 사용량을 검토하세요."}`,
    });
  }
  return design;
}

const regions = { aws: "ap-northeast-2", gcp: "asia-northeast3", "naver-cloud": "KR", "on-premise": "local" };

function validateOptions(input: DesignInput, runtime: Runtime, database: DatabaseChoice) {
  if (!["server", "static", "undecided"].includes(runtime) || !["required", "none", "undecided"].includes(database)) {
    throw new TypeError("Unknown runtime or database choice.");
  }
  if (runtime === "static" && database === "required") throw new TypeError("Model a database-backed API separately from a static site.");
  if (input.peakConcurrent !== undefined && (!Number.isSafeInteger(input.peakConcurrent) || input.peakConcurrent < 0)) throw new TypeError("Invalid peakConcurrent.");
  if (input.growthRate !== undefined && (!Number.isFinite(input.growthRate) || input.growthRate < 0)) throw new TypeError("Invalid growthRate.");
  for (const key of ["needsRealtime", "needsAI", "needsFileUpload", "isGlobal"] as const) {
    if (input[key] !== undefined && typeof input[key] !== "boolean") throw new TypeError(`Invalid ${key}.`);
  }
  const facts = input.starter;
  if (facts === undefined) return;
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) throw new TypeError("Invalid starter.");
  for (const value of [facts.language, facts.framework, ...(facts.orm === null ? [] : [facts.orm])]) {
    if (value !== undefined && (typeof value !== "string" || !value.trim())) throw new TypeError("Invalid starter stack.");
  }
  if (facts.entrypoints !== undefined && (!Array.isArray(facts.entrypoints) || !facts.entrypoints.every(v => typeof v === "string" && v.trim()))) {
    throw new TypeError("Invalid starter entrypoints.");
  }
}

function applyRequirements(design: ArchitecturePlan, input: DesignInput) {
  const decisions = design.designDecisions;
  if (input.needsRealtime) {
    decisions.push({ decision: "실시간 연결", reason: design.compute
      ? "WebSocket 연결 수와 종료 시 연결 배출 시간을 측정합니다. CPU 사용률과 함께 활성 연결 수로 확장 시점을 판단합니다."
      : "실시간 처리는 별도 연결 서버 또는 관리형 서비스가 필요합니다. 이 구성의 비용에는 포함되지 않습니다." });
    if (design.compute) design.scalingStrategy.unshift("인스턴스별 활성 연결 수와 재연결 폭주를 부하 테스트합니다.");
  }
  if (input.peakConcurrent !== undefined) design.scalingStrategy.unshift(
    `피크 동시 사용자 ${input.peakConcurrent}명으로 부하 테스트하고 p95 지연과 오류율을 측정합니다.`);
  if (input.growthRate !== undefined) design.scalingStrategy.push(
    `6개월 성장률 ${input.growthRate}% 가정으로 DAU ${Math.ceil(input.dau * (1 + input.growthRate / 100))}명에서 재검증합니다.`);
  if (input.needsFileUpload) decisions.push({ decision: "파일 업로드", reason: "객체 저장소 직접 업로드와 업로드 한도를 검토합니다. 쓰기 요청과 전송량은 별도 산정합니다." });
  if (input.needsAI) decisions.push({ decision: "AI 추론", reason: "모델, 처리량, 지연 목표를 정한 뒤 추론 서비스를 선택합니다. 모델 호출과 GPU 비용은 별도입니다." });
  if (input.isGlobal) decisions.push({ decision: "글로벌 서비스", reason: "주요 사용자 지역에서 지연을 측정한 뒤 CDN과 데이터 복제 지역을 정합니다. 다중 리전 비용은 별도입니다." });
}

function serverTemplate(input: DesignInput, platform: Platform): ArchitectureDesign {
  // 규모 결정
  const scale = determineScale(input.dau);

  // 아키텍처 패턴 조회
  const pattern = getArchitecturePattern(platform, input.serviceType, scale);

  // CPU 아키텍처 추천
  const cpuArch = pattern.compute.service === "cloud-run" ? {
    architecture: "x86_64" as const, reason: "Cloud Run 컨테이너 런타임 ABI",
    constraints: ["이미지에 linux/amd64를 포함하세요. https://docs.cloud.google.com/run/docs/container-contract"],
    recommendedInstance: "cloud-run", costSaving: "",
  } : recommendCpuArchitecture(
    input.serviceType === "ai-ml" ? "ml-inference" : "web-api",
    platform
  );

  return buildArchitectureDesign({ ...input, platform }, pattern, cpuArch);
}

function determineScale(dau: number): "mvp" | "small" | "medium" | "large" | "enterprise" {
  if (dau < 100) return "mvp";
  if (dau < 1000) return "small";
  if (dau < 10000) return "medium";
  if (dau < 100000) return "large";
  return "enterprise";
}

function buildArchitectureDesign(
  input: DesignInput & { platform: Platform },
  pattern: ReturnType<typeof getArchitecturePattern>,
  cpuArch: ReturnType<typeof recommendCpuArchitecture>
): ArchitectureDesign {
  const now = new Date().toISOString().split("T")[0];

  return {
    meta: {
      serviceName: input.description.trim().split(" ")[0].toLowerCase() || "my-app",
      platform: input.platform,
      region: regions[input.platform],
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
      ...(input.database === undefined || input.database === "required" ? [{
        decision: `${pattern.database.type} 데이터베이스`,
        reason: pattern.database.reason,
      }] : []),
    ],
  };
}
