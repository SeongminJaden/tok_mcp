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

## 스타터에서 선택한 스택 전달하기

GitHub의 0.3.0 소스에서 사용할 수 있습니다. 이 버전을 시험하려면 저장소 루트에서 `npm ci && npm pack`을 실행하고, 소비 프로젝트에서 생성된 `tok_mcp-0.3.0.tgz`를 설치하세요. 아래 MCP 설정의 0.2.0은 기존 공개 버전입니다. 소스 빌드를 MCP로 실행하려면 설정의 command에 `node`, args에 빌드된 `dist/cli.js`의 절대 경로를 지정하세요.

```js
const design = designArchitecture({
  description: "docs-site", serviceType: "web-api", dau: 500, monthlyBudget: 150,
  platform: "aws", runtime: "static", database: "none",
  starter: {
    framework: "Next.js (App Router)", language: "typescript",
    orm: null, entrypoints: ["app/layout.tsx", "app/page.tsx"],
  },
});
```

`starter`에는 생성기에서 확인한 값을 넣습니다. ORM을 선택하지 않았으면 `null`로 지정합니다. `runtime`은 `server`, `static`, `undecided` 중 하나이고 `database`는 `required`, `none`, `undecided` 중 하나입니다. 공급자도 정해지지 않았다면 `platform: "undecided"`를 사용합니다. 기존처럼 공급자만 지정하면 서버와 DB가 있는 설계를 생성합니다.

정적 배포의 기본 DB 선택은 `none`입니다. 서울 AWS 예제는 정적 파일 50GB의 기본료로 월 $1.25를 계산합니다. DB 없는 서버는 계산에서 DB와 캐시를 제외합니다. DB 또는 배포 방식이 미정이면 총액을 보류합니다. 정적 사이트에 별도 API가 필요하면 서버 설계를 따로 만듭니다. MCP의 `estimate_cost`에도 `{ design }`을 넘길 수 있으며, 보류된 비용은 `null`입니다.

`peakConcurrent`는 부하 테스트의 동시 사용자 목표, `growthRate`는 6개월 뒤 검증할 DAU를 정합니다. `needsRealtime`은 활성 연결 수와 재연결 테스트, `needsFileUpload`는 업로드 한도, `needsAI`는 추론 용량과 비용, `isGlobal`은 지역별 지연과 복제 검토를 설계 문서에 추가합니다. 이 값만으로 필요한 서버 수나 추가 서비스 요금을 단정하지 않습니다.

[다섯 스타터 실행 및 검증](examples/starter-integrations/README.md)

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
