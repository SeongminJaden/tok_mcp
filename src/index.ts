#!/usr/bin/env node

/**
 * tok_mcp - AI 바이브 코더를 위한 아키텍처 설계 전문 MCP
 *
 * 이 MCP는 직접 환경을 설정하지 않고,
 * AI가 인식 가능한 개발 문서를 레포지토리에 생성합니다.
 *
 * 생성되는 핵심 파일:
 * - ARCHITECTURE.md: 사람이 읽는 아키텍처 문서
 * - .ai-context.yaml: AI가 읽는 컨텍스트 파일
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { tools, ToolName } from "./tools/index.js";
import { handleDesignArchitecture } from "./tools/design-architecture.js";
import { handleGetAwsReference } from "./tools/get-aws-reference.js";
import { handleRecommendCpuArch } from "./tools/recommend-cpu-arch.js";
import { handleEstimateCost } from "./tools/estimate-cost.js";
import { handleGetScalingStrategy } from "./tools/get-scaling-strategy.js";
import { handleGenerateDocs } from "./tools/generate-docs.js";

// 서버 인스턴스 생성
const server = new Server(
  {
    name: "tok_mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 요청 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 도구 호출 요청 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name as ToolName) {
      case "design_architecture":
        return await handleDesignArchitecture(args);

      case "get_aws_reference":
        return await handleGetAwsReference(args);

      case "recommend_cpu_arch":
        return await handleRecommendCpuArch(args);

      case "estimate_cost":
        return await handleEstimateCost(args);

      case "get_scaling_strategy":
        return await handleGetScalingStrategy(args);

      case "generate_docs":
        return await handleGenerateDocs(args);

      default:
        return {
          content: [
            {
              type: "text",
              text: `알 수 없는 도구: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `오류 발생: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// 메인 함수
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("tok_mcp server started");
}

main().catch(console.error);
