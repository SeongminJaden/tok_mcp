/**
 * Vercel Serverless Function for tok_mcp
 * HTTP/SSE 기반 MCP 서버
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { tools } from "../src/tools/index.js";
import { handleDesignArchitecture } from "../src/tools/design-architecture.js";
import { handleGetAwsReference } from "../src/tools/get-aws-reference.js";
import { handleRecommendCpuArch } from "../src/tools/recommend-cpu-arch.js";
import { handleEstimateCost } from "../src/tools/estimate-cost.js";
import { handleGetScalingStrategy } from "../src/tools/get-scaling-strategy.js";
import { handleGenerateDocs } from "../src/tools/generate-docs.js";

// CORS 헤더 설정
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// JSON-RPC 응답 생성
function jsonRpcResponse(id: number | string | null, result: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function jsonRpcError(id: number | string | null, code: number, message: string) {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
}

// 도구 호출 핸들러
async function handleToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
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
        content: [{ type: "text", text: `알 수 없는 도구: ${name}` }],
        isError: true,
      };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET 요청 - 서버 정보
  if (req.method === "GET") {
    return res.status(200).json({
      name: "tok_mcp",
      version: "0.1.0",
      description: "AI 바이브 코더를 위한 아키텍처 설계 전문 MCP",
      endpoints: {
        "POST /api/mcp": "JSON-RPC 요청 처리",
        "GET /api/mcp": "서버 정보",
      },
      tools: tools.map((t) => ({ name: t.name, description: t.description })),
    });
  }

  // POST 요청 - JSON-RPC 처리
  if (req.method === "POST") {
    try {
      const { jsonrpc, id, method, params } = req.body;

      if (jsonrpc !== "2.0") {
        return res.status(400).json(jsonRpcError(id, -32600, "Invalid JSON-RPC version"));
      }

      switch (method) {
        case "initialize":
          return res.status(200).json(
            jsonRpcResponse(id, {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "tok_mcp", version: "0.1.0" },
            })
          );

        case "tools/list":
          return res.status(200).json(jsonRpcResponse(id, { tools }));

        case "tools/call":
          const { name, arguments: args } = params || {};
          if (!name) {
            return res.status(400).json(jsonRpcError(id, -32602, "Missing tool name"));
          }
          const result = await handleToolCall(name, args || {});
          return res.status(200).json(jsonRpcResponse(id, result));

        default:
          return res.status(400).json(jsonRpcError(id, -32601, `Unknown method: ${method}`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json(jsonRpcError(null, -32603, message));
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
