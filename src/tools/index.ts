/**
 * MCP 도구 정의
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

const filesSchema = {
  type: "object",
  required: ["ARCHITECTURE.md", ".ai-context.yaml"],
  properties: { "ARCHITECTURE.md": { type: "string" }, ".ai-context.yaml": { type: "string" } },
};

// 도구 정의 목록
export const tools: Tool[] = [
  {
    name: "design_architecture",
    description:
      "서비스 요구사항으로 설계안을 만듭니다. Draft an architecture from service requirements.",
    outputSchema: {
      type: "object",
      properties: { files: filesSchema, design: { type: "object" } },
      required: ["files", "design"],
    },
    inputSchema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: ["aws", "gcp", "naver-cloud", "on-premise"],
          description: "클라우드 플랫폼 (aws, gcp, naver-cloud, on-premise)",
        },
        serviceType: {
          type: "string",
          enum: [
            "web-api",
            "saas",
            "game",
            "messenger",
            "ai-ml",
            "media",
            "iot",
            "ecommerce",
            "other",
          ],
          description: "서비스 유형",
        },
        description: {
          type: "string",
          description: "서비스에 대한 간단한 설명",
        },
        dau: {
          type: "number",
          description: "예상 일일 활성 사용자 수 (DAU)",
        },
        peakConcurrent: {
          type: "number",
          description: "피크 시간 동시 접속자 수",
        },
        monthlyBudget: {
          type: "number",
          description: "월 인프라 예산 (USD)",
        },
        needsRealtime: {
          type: "boolean",
          description: "실시간 기능 필요 여부 (WebSocket 등)",
        },
        needsFileUpload: {
          type: "boolean",
          description: "파일 업로드 기능 필요 여부",
        },
        needsAI: {
          type: "boolean",
          description: "AI/ML 기능 필요 여부",
        },
        isGlobal: {
          type: "boolean",
          description: "글로벌 서비스 여부",
        },
        growthRate: {
          type: "number",
          description: "6개월 후 예상 성장률 (%)",
        },
      },
      required: ["platform", "serviceType", "description", "dau", "monthlyBudget"],
    },
  },
  {
    name: "get_aws_reference",
    description:
      "서비스 종류와 규모에 맞는 AWS 패턴을 찾습니다. Look up an AWS pattern by workload and scale.",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceType: {
          type: "string",
          enum: [
            "web-api",
            "saas",
            "game",
            "messenger",
            "ai-ml",
            "media",
            "iot",
            "ecommerce",
          ],
          description: "서비스 유형",
        },
        scale: {
          type: "string",
          enum: ["mvp", "small", "medium", "large", "enterprise"],
          description: "서비스 규모",
        },
      },
      required: ["serviceType", "scale"],
    },
  },
  {
    name: "recommend_cpu_arch",
    description:
      "워크로드에 맞는 CPU 아키텍처를 고릅니다. Compare CPU architectures for a workload.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workloadType: {
          type: "string",
          enum: [
            "web-api",
            "ml-inference",
            "ml-training",
            "hpc",
            "legacy",
            "container",
            "general",
          ],
          description: "워크로드 유형",
        },
        platform: {
          type: "string",
          enum: ["aws", "gcp", "naver-cloud"],
          description: "클라우드 플랫폼",
        },
      },
      required: ["workloadType"],
    },
  },
  {
    name: "estimate_cost",
    description:
      "서울 공개 단가로 월 기본 비용을 계산합니다. Estimate monthly baseline costs using Seoul list prices.",
    inputSchema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: ["aws", "gcp", "naver-cloud"],
          description: "클라우드 플랫폼",
        },
        compute: {
          type: "object",
          properties: {
            service: { type: "string" },
            cpuArch: { type: "string", enum: ["arm64", "x86_64"], description: "Fargate 기본값 x86_64" },
            instances: { type: "number" },
            cpu: { type: "string" },
            memory: { type: "string" },
          },
          description: "컴퓨팅 구성",
        },
        database: {
          type: "object",
          properties: {
            type: { type: "string" },
            instance: { type: "string" },
            storage: { type: "number" },
          },
          description: "데이터베이스 구성",
        },
        cache: {
          type: "object",
          properties: {
            type: { type: "string" },
            instance: { type: "string" },
          },
          description: "캐시 구성 (선택)",
        },
      },
      required: ["platform", "compute", "database"],
    },
  },
  {
    name: "get_scaling_strategy",
    description:
      "예상 트래픽에 따른 확장 단계를 제안합니다. Plan capacity changes for a traffic target.",
    inputSchema: {
      type: "object" as const,
      properties: {
        currentDau: {
          type: "number",
          description: "현재 DAU",
        },
        targetDau: {
          type: "number",
          description: "목표 DAU",
        },
        platform: {
          type: "string",
          enum: ["aws", "gcp", "naver-cloud"],
          description: "클라우드 플랫폼",
        },
        currentArchitecture: {
          type: "string",
          description: "현재 아키텍처 설명",
        },
      },
      required: ["currentDau", "targetDau", "platform"],
    },
  },
  {
    name: "generate_docs",
    description:
      "설계안에서 Markdown과 YAML을 만듭니다. Render a design as Markdown and YAML.",
    outputSchema: {
      type: "object",
      properties: { files: filesSchema },
      required: ["files"],
    },
    inputSchema: {
      type: "object" as const,
      properties: {
        design: {
          type: "object",
          description: "아키텍처 설계 결과 객체",
        },
        outputPath: {
          type: "string",
          description: "문서 출력 경로 (기본: 현재 디렉토리)",
        },
      },
      required: ["design"],
    },
  },
];

// 도구 이름 타입
export type ToolName =
  | "design_architecture"
  | "get_aws_reference"
  | "recommend_cpu_arch"
  | "estimate_cost"
  | "get_scaling_strategy"
  | "generate_docs";
