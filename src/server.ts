import { createRequire } from "node:module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
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

export const { version } = createRequire(import.meta.url)("../package.json");

export function createServer() {
  // 서버 인스턴스 생성
  const server = new Server(
    {
      name: "tok_mcp",
      version,
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
  return server;
}
