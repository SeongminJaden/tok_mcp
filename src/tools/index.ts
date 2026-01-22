/**
 * MCP 도구 정의
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// 도구 정의 목록
export const tools: Tool[] = [
  {
    name: "design_architecture",
    description:
      "대화형 질문을 통해 서비스에 맞는 아키텍처를 설계합니다. 플랫폼, 규모, 예산 등을 분석하여 최적의 아키텍처를 추천하고 ARCHITECTURE.md와 .ai-context.yaml 문서를 생성합니다.",
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
      "AWS 모범 사례 아키텍처를 조회합니다. 서비스 유형과 규모에 맞는 AWS Well-Architected 기반 아키텍처 패턴을 제공합니다.",
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
      "워크로드 특성에 따라 최적의 CPU 아키텍처(ARM/x86)를 추천합니다. 비용 효율성과 성능을 고려한 추천을 제공합니다.",
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
      "아키텍처 구성에 대한 월간 예상 비용을 계산합니다. 각 서비스별 비용 breakdown을 제공합니다.",
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
      "현재 아키텍처에 대한 확장 전략을 제안합니다. 트래픽 증가 시나리오별 대응 방안을 제공합니다.",
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
      "아키텍처 설계 결과를 바탕으로 ARCHITECTURE.md (사람용)와 .ai-context.yaml (AI용) 문서를 생성합니다.",
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
