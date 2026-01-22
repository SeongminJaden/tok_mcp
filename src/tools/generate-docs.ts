/**
 * generate_docs 도구 핸들러
 * ARCHITECTURE.md와 .ai-context.yaml 문서 생성
 */

import { ArchitectureDesign, CostEstimate } from "../types/index.js";
import { generateArchitectureMd, generateAiContextYaml } from "../generators/docs.js";

interface GenerateDocsInput {
  design: ArchitectureDesign;
  outputPath?: string;
}

export async function handleGenerateDocs(args: unknown) {
  const input = args as GenerateDocsInput;

  if (!input.design) {
    return {
      content: [
        {
          type: "text",
          text: `필수 입력값이 누락되었습니다.

design_architecture 도구를 먼저 실행하여 아키텍처 설계를 생성한 후,
그 결과를 이 도구에 전달하세요.

또는 직접 design 객체를 전달할 수 있습니다:

{
  "design": {
    "meta": { "serviceName": "my-app", "platform": "aws", ... },
    "compute": { ... },
    "database": { ... },
    ...
  }
}`,
        },
      ],
    };
  }

  // 비용 추정 (간단한 계산)
  const cost: CostEstimate = {
    compute: 30,
    database: 20,
    cache: 15,
    storage: 5,
    networking: 20,
    other: 5,
    total: 95,
    currency: "USD",
  };

  const architectureMd = generateArchitectureMd(input.design, cost);
  const aiContextYaml = generateAiContextYaml(input.design);

  const outputPath = input.outputPath || ".";

  return {
    content: [
      {
        type: "text",
        text: `## 문서 생성 완료

다음 파일들이 생성되었습니다:

---

### 📄 ARCHITECTURE.md

저장 경로: \`${outputPath}/ARCHITECTURE.md\`

\`\`\`markdown
${architectureMd}
\`\`\`

---

### 🤖 .ai-context.yaml

저장 경로: \`${outputPath}/.ai-context.yaml\`

\`\`\`yaml
${aiContextYaml}
\`\`\`

---

### 사용 방법

1. 위 내용을 각각 \`ARCHITECTURE.md\`와 \`.ai-context.yaml\` 파일로 저장하세요.

2. 이후 AI에게 다음과 같이 요청하세요:
   - "이 프로젝트의 아키텍처 설명해줘" → ARCHITECTURE.md 참조
   - ".ai-context.yaml 참고해서 API 서버 만들어줘" → 아키텍처에 맞게 개발

3. AI는 .ai-context.yaml을 읽고 프로젝트 구조, 제약사항, 개발 패턴을 이해한 상태로 개발합니다.`,
      },
    ],
  };
}
