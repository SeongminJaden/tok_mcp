# 스타터 CLI 채택 후보와 제품 개선

2026-11-26 기준. 순서는 기존 입력을 얼마나 재사용할 수 있는지, 생성 흐름에서 어느 지점에 붙일 수 있는지, 잘못된 인프라를 제안할 가능성을 기준으로 정했다. 모두 MIT 라이선스다. 이 순위는 기술 적합성에 대한 판단이다. 유지보수자와 도입 의사를 확인한 곳은 아직 없다.

| 순서 | 후보와 확인한 버전 | 연결할 지점 | 첫 제안의 범위와 제약 |
|---|---|---|---|
| 1 | [create-t3-app 7.40.0](https://github.com/t3-oss/create-t3-app/blob/4709861f7e67a15564c0460c13e7b4b6cfcae40d/cli/src/index.ts) | runCli가 DB와 패키지 선택을 반환하고 createProject가 실제 경로를 반환한다. 최종 package.json 저장 후, git 초기화 전에 붙인다. | Prisma + PostgreSQL + tRPC부터. 스키마의 datasource를 읽어 ORM과 DB를 확인할 수 있다. DAU·예산·배포처는 별도 선택이다. |
| 2 | [@nestjs/cli 12.0.15](https://github.com/nestjs/nest-cli/blob/32eaf76c7de0f8fbb63d4a313d5109c0308c1115/actions/new.action.ts) | new 액션의 generateApplicationFiles 완료 후 실제 projectDirectory를 사용한다. | 백엔드 시작점과 HTTP 어댑터가 명확하다. 먼저 팀 전용 schematic에 넣어 검증할 수 있다. 기존 AGENTS.md와 CLAUDE.md는 생성기가 관리한다. |
| 3 | [create-fastify 5.0.0](https://github.com/fastify/create-fastify/blob/42e497bf67e0ca1e0d08acb9d35a9c28bc5a7e0a/cmd.js) | 진입점은 fastify-cli/generate에 위임한다. 앱 생성이 끝난 뒤 manifest를 사용한다. [생성 구현](https://github.com/fastify/fastify-cli/blob/1fb1f49ab52b6ead413fb3ee7be640b494ef64e2/generate.js) | JS 앱 템플릿의 app.js·routes·plugins를 재사용한다. 얇은 생성기에 클라우드 의존성을 추가하는 비용이 있으므로 사내 플랫폼용 래퍼부터 적합하다. |
| 4 | [express-generator 4.16.1](https://github.com/expressjs/generator/blob/d1f3fcc6ccc7ab8986fb3438c82ab1a1f20dc50d/bin/express-cli.js) | createApplication이 app.js, package.json, bin/www를 쓴다. 이 단계 이후 실행한다. | JS 서비스 매핑이 간단하다. 원본은 CommonJS이고 tok_mcp는 ESM이므로 생성기 안에서 붙일 땐 비동기 import와 완료 대기가 필요하다. 외부 래퍼가 더 작은 변경이다. |
| 5 | [create-next-app 16.4.6](https://github.com/vercel/next.js/blob/54b876b6b161b0ecda19562eb264bec637e60d6d/packages/create-next-app/index.ts) | 기본 템플릿과 사용자 example 모두 createApp을 호출한다. 예제는 기본 App Router TS 생성 후에만 실행한다. | 자체 호스팅 Node 서비스에 한정한다. 기본 생성물만으로 정적 사이트·관리형 배포·자체 호스팅 여부를 결정할 수 없다. |

## 0.2.0 통합에서 드러난 문제

아래 표는 0.2.0 평가 기록이다. GitHub의 0.3.0 소스에서는 P0 세 항목을 구현했다. 현재 시나리오와 검증 결과는 [통합 실행 안내](README.md)에 있다.

| 우선순위 | 관찰 | 제안할 기능 | 완료 기준 |
|---|---|---|---|
| P0 | 기본 개발 가이드가 Express·Prisma와 정해진 폴더를 넣는다. 다섯 어댑터 모두 프레임워크나 폴더를 고쳐야 했다. | 공개 입력에 framework, language, orm, entrypoints를 받는다. ORM의 미선택 상태를 표현한다. 관측된 값과 배포 제안을 구분한다. | 기존 설계 객체를 사후 수정하는 코드 없이 다섯 템플릿에서 현재 검증을 통과한다. |
| P0 | DB가 없는 네 템플릿에도 시나리오에서 PostgreSQL을 지정해야 한다. compute와 primary DB가 필수라 정적 사이트도 DB 비용을 가질 수 있다. | 배포 런타임과 DB를 required / none / undecided로 모델링하고 문서·가격에 반영한다. | 정적 Next 예제에는 DB·상시 컨테이너 비용이 없고 미선택 항목은 무료로 표시되지 않는다. |
| P0 | 공개 0.2.0에서 DAU 500, 같은 AWS 웹 API 입력을 고정한 뒤 peakConcurrent, needsRealtime, needsAI, needsFileUpload, isGlobal, growthRate를 하나씩 바꿨다. 여섯 경우 모두 전체 설계 객체가 같았다. | 실제로 쓰는 입력만 약속한다. 우선 피크 동시성·실시간 연결에 대한 규칙과 결정 사유를 넣고 미지원 입력을 표시한다. | 표준 시나리오를 바꾸면 관련 결정이 바뀌거나 미지원 사유가 출력된다. |
| P1 | 비용은 여러 구성요소를 합한 서울 리전 기본료다. 다섯 예제는 같은 배포 조건이라 프레임워크가 달라도 같은 금액이 나온다. | 비용을 리전, 과금 기준일, 포함·제외 항목, 산정 보류 사유와 함께 구조화한다. | 생성기가 텍스트를 파싱하지 않고 금액과 보류 사유를 UI에 표시한다. |
| P1 | 패키지 루트에서 MCP 서버를 시작하지 않지만 npm 설치 시 MCP SDK는 일반 의존성으로 설치된다. | 생성기 전용 코어 배포와 기존 tok_mcp 진입점 유지를 실험한다. | 같은 빈 소비 프로젝트에서 설치 용량·시간을 비교하고 결과 JSON·YAML 및 기존 CLI 호환성을 함께 확인한다. |
| P1 | 영문 사용자가 읽을 README가 있어도 렌더링된 설계 근거와 안내문은 한국어다. | locale 옵션을 렌더러까지 전달한다. | ko/en에서 기계용 키와 비용 수치가 같고 설명문만 번역된다. |

## 첫 채택 실험

1. T3 기반으로 서비스 템플릿을 배포하는 유지보수자에게 실제 PostgreSQL 예제와 출력 두 파일을 보여준다. 성공 기준은 CLI package.json의 직접 의존성과 생성 결과를 포함한 외부 릴리스 한 건이다.
2. Nest 사내 schematic에서는 `nest new` 시 이미 고른 언어와 HTTP 어댑터를 재사용한다. 사용자에게 더 물어본 항목, 생성 후 삭제한 항목, 지원 요청이 나온 DB 종류를 기록한다.
3. 두 곳의 피드백을 보고 코어 분리와 추가 가격표의 순서를 정한다. 설치 수는 npx 실행과 CI 설치를 포함할 수 있으므로 외부 유지보수자·릴리스·manifest 링크를 별도로 기록한다.
