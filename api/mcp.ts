import type { VercelRequest, VercelResponse } from "@vercel/node";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, version } from "../src/server.js";
import { tools } from "../src/tools/index.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version, Accept");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET" && !req.headers.accept?.includes("text/event-stream")) {
    return res.json({
      name: "tok_mcp", version,
      description: "AI 바이브 코더를 위한 아키텍처 설계 전문 MCP",
      endpoints: { "POST /api/mcp": "JSON-RPC 요청 처리", "GET /api/mcp": "서버 정보" },
      tools: tools.map(({ name, description }) => ({ name, description })),
    });
  }
  if (req.method !== "POST") return res.status(405).end();
  // Existing JSON-RPC consumers may omit the MCP-specific Accept header.
  if (!req.headers.accept || ["*/*", "application/json"].includes(req.headers.accept)) {
    req.headers.accept = "application/json, text/event-stream";
  }
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } finally {
    await server.close();
  }
}
