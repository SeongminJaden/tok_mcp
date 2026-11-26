# 스타터 CLI에 tok_mcp 붙이기

[English](README.en.md)

생성기가 만든 framework, language, orm, entrypoints를 공개 API의 `starter` 입력에 넘긴다. 앱의 package.json에 tok_mcp를 추가할 필요는 없다. 이 디렉터리는 `file:../..`로 현재 체크아웃의 패키지를 사용한다. 먼저 저장소 루트에서 `npm ci`로 빌드한다.

## T3 전체 흐름

이 디렉터리에서 다음을 실행한다. Node.js 22.23.5에서 확인했다. 프로젝트 이름은 아직 없는 디렉터리 이름이어야 한다.

```sh
npm install
node t3/create.mjs team-board 500 150
```

마지막 두 숫자는 DAU와 월 예산(USD)이다. 래퍼가 T3의 PostgreSQL·Prisma·tRPC 템플릿을 생성하고 `team-board/tok-architecture/`에 두 파일을 쓴다. 앱 의존성 설치, DB 생성, 인프라 배포는 별도다. 실제 출력은 [설계 문서](sample/ARCHITECTURE.md)와 [YAML](sample/.ai-context.yaml)에 있다.

## 다른 생성기에 연결하기

생성기 자체의 dependencies에 `tok_mcp`를 추가한다. 파일을 쓴 뒤부터 아래 함수를 호출할 수 있다. 기존 CLI에 시험 적용할 때는 `integration.mjs`를 생성기 소스에 함께 둔다.

```js
import { renderStarterDocs } from "./integration.mjs";

const files = await renderStarterDocs("nest", projectDirectory, {
  platform: "gcp",
  runtime: "server",
  database: "undecided",
  serviceType: "web-api",
  dau: 500,
  monthlyBudget: 150,
});
// files["ARCHITECTURE.md"]와 files[".ai-context.yaml"]을 생성기의 파일 쓰기 단계에 전달한다.
```

아래 명령은 이 디렉터리에서 실행한다. 각 명령 쌍은 독립된 예제다. 기존 프로젝트를 덮어쓰지 않도록 `run.mjs`는 출력 디렉터리가 있으면 중단한다.

```sh
npx --yes @nestjs/cli@12.0.15 new nest-api --skip-install --skip-git --package-manager npm --language ts
node run.mjs nest nest-api 500 150

npx --yes create-fastify@5.0.0 fastify-api
node run.mjs fastify fastify-api 500 150

npx --yes express-generator@4.16.1 express-api --no-view
node run.mjs express express-api 500 150

npx --yes create-next-app@16.4.6 next-web --yes --ts --app --no-tailwind --skip-install --disable-git --use-npm
node run.mjs next next-web 500 150
```

각 어댑터는 지정한 버전과 옵션의 생성물을 대상으로 한다. T3의 Drizzle·SQLite, Fastify의 TypeScript 템플릿, Nest의 Fastify 어댑터, 다른 Next.js 디렉터리 레이아웃는 별도 통합이 필요하다. 앱에 들어 있는 .env 파일은 읽지 않는다.

## 검증 범위

다섯 공식 CLI를 실행한 다음, 소스에서 패킹한 0.3.0을 별도 소비 프로젝트에 설치해 검증했다. 다음은 각 실행의 배포 시나리오다. Next.js의 정적 배포는 제안이며 실제 Next 설정을 변경하지 않는다.

| 예제 | 배포·DB 선택 | 월 기본료 |
|---|---|---:|
| T3 | AWS 서버, PostgreSQL | $72.65 |
| Nest | GCP 서버, DB 미정, AI 추론 검토 | 산정 보류 |
| Fastify | AWS 서버, DB 없음, 실시간, 피크 동시 사용자 2,000명 | $34.26 |
| Express | 공급자·런타임·DB 미정 | 산정 보류 |
| Next.js | AWS 정적 호스팅, DB 없음 | $1.25 |

앞의 명령으로 다섯 프로젝트를 만든 뒤 `node verify.mjs .`를 실행한다. 프로젝트 이름, 스택, 문서의 경로, 배포 상태, 비용 및 요구사항 반영을 검사한다. 검증 범위는 생성기와 문서이며 앱 빌드나 클라우드 배포는 포함하지 않는다.

[후보별 소스와 개선 우선순위](ADOPTION.md)
