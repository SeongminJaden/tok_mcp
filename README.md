# tok_mcp

[한국어](https://github.com/SeongminJaden/tok_mcp/blob/main/README.md) · [English](https://github.com/SeongminJaden/tok_mcp/blob/main/README.en.md)

tok_mcp는 서비스 종류와 예상 사용자 수를 받아 클라우드 설계 초안을 만듭니다. 결과는 팀에서 검토할 `ARCHITECTURE.md`와 코딩 도구에 전달할 `.ai-context.yaml`입니다.

## 라이브러리로 사용하기

```sh
npm install tok_mcp
```

```js
import { designArchitecture, generateArchitectureDocs } from "tok_mcp";

const design = designArchitecture({
  platform: "aws",
  serviceType: "saas",
  description: "TeamNotes",
  dau: 500,
  monthlyBudget: 150,
});
const files = generateArchitectureDocs(design);
console.log(files["ARCHITECTURE.md"]);
```

프로젝트에서 파일을 저장할 경로를 정합니다. 같은 설계를 수정한 뒤 문서만 다시 만들 수도 있습니다. [스타터에서 두 파일을 저장하는 방법](https://github.com/SeongminJaden/tok_mcp/blob/main/examples/starter.mjs)

## Cursor 또는 Claude Desktop에서 사용하기

MCP 설정 파일에 아래 항목을 추가합니다. 연결 후 `design_architecture`를 호출하고, 수정한 설계는 `generate_docs`에 넘깁니다. 두 도구 모두 `structuredContent.files`에 파일 본문을 반환합니다.

```json
{
  "mcpServers": {
    "tok_mcp": { "command": "npx", "args": ["-y", "tok_mcp@0.2.0"] }
  }
}
```

## 비용을 읽는 법

예제의 서울 AWS 구성은 월 $95.56입니다. Fargate ARM 태스크 1개, RDS PostgreSQL 1대, Redis 노드 1개를 월 730시간 구동하는 조건입니다. 트래픽 비용과 세금은 별도입니다. [단가표 / Price sheet](https://github.com/SeongminJaden/tok_mcp/blob/main/PRICING.md)

0.1.x에서 올릴 때는 YAML을 읽는 코드의 필드 경로를 확인하세요. 새 형식의 버전은 `schema_version: 2`이고 설계 초안에는 `status: proposed`가 붙습니다. [YAML](https://github.com/SeongminJaden/tok_mcp/blob/main/examples/teamnotes/.ai-context.yaml) · [Markdown](https://github.com/SeongminJaden/tok_mcp/blob/main/examples/teamnotes/ARCHITECTURE.md)

개발 환경에서는 `npm ci && npm test`로 빌드와 통합 테스트를 실행합니다.

[GitHub](https://github.com/SeongminJaden/tok_mcp) · [npm](https://www.npmjs.com/package/tok_mcp) · [Buy Me a Coffee](https://buymeacoffee.com/tok_coding) · MIT
