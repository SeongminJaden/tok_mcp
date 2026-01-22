/**
 * get_aws_reference 도구 핸들러
 * AWS 모범 사례 아키텍처를 조회합니다.
 */

import { ServiceType, Scale } from "../types/index.js";
import { getArchitecturePattern } from "../data/patterns.js";

interface AwsReferenceInput {
  serviceType: ServiceType;
  scale: Scale;
}

export async function handleGetAwsReference(args: unknown) {
  const input = args as AwsReferenceInput;

  if (!input.serviceType || !input.scale) {
    return {
      content: [
        {
          type: "text",
          text: `필수 입력값이 누락되었습니다.

필수 항목:
- serviceType: 서비스 유형 (web-api, saas, game, messenger, ai-ml, media, iot, ecommerce)
- scale: 규모 (mvp, small, medium, large, enterprise)`,
        },
      ],
    };
  }

  const pattern = getArchitecturePattern("aws", input.serviceType, input.scale);

  const diagram = generateAwsDiagram(pattern);

  return {
    content: [
      {
        type: "text",
        text: `## AWS 모범 사례 아키텍처

### 서비스 유형: ${input.serviceType}
### 규모: ${input.scale}

---

### 아키텍처 다이어그램

\`\`\`
${diagram}
\`\`\`

---

### 구성 요소

#### 컴퓨팅
- **서비스**: ${pattern.compute.service}
- **사양**: ${pattern.compute.cpu}, ${pattern.compute.memory}
- **스케일링**: ${pattern.compute.minInstances} ~ ${pattern.compute.maxInstances} 인스턴스
- **선택 이유**: ${pattern.compute.reason}

#### 데이터베이스
- **타입**: ${pattern.database.type}
- **서비스**: ${pattern.database.service}
- **인스턴스**: ${pattern.database.instance}
- **선택 이유**: ${pattern.database.reason}

${
  pattern.cache
    ? `#### 캐시
- **타입**: ${pattern.cache.type}
- **서비스**: ${pattern.cache.service}
- **인스턴스**: ${pattern.cache.instance}`
    : ""
}

#### 네트워킹
- **로드밸런서**: ${pattern.networking.loadBalancer}
- **DNS**: ${pattern.networking.dns}
- **SSL**: ${pattern.networking.ssl}

---

### 확장 전략

${pattern.scalingStrategy.map((s, i) => `${i + 1}. ${s}`).join("\n")}

---

### 참고 자료
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Solutions Library](https://aws.amazon.com/solutions/)`,
      },
    ],
  };
}

function generateAwsDiagram(pattern: ReturnType<typeof getArchitecturePattern>): string {
  return `┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ${pattern.networking.dns} → CloudFront → ${pattern.networking.loadBalancer}
│                                    │                        │
│                                    ▼                        │
│                          ┌─────────────────┐               │
│                          │  ${pattern.compute.service.padEnd(15)}│               │
│                          │  (Auto Scaling) │               │
│                          └────────┬────────┘               │
│                                   │                        │
│                    ┌──────────────┼──────────────┐         │
│                    ▼              ▼              ▼         │
│             ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│             │   ${pattern.database.service.padEnd(6)} │  │  ${(pattern.cache?.service || "N/A").padEnd(6)} │  │   ${(pattern.storage?.service || "N/A").padEnd(6)} │      │
│             │${pattern.database.type.padEnd(10)}│  │  Cache   │  │ Storage │      │
│             └──────────┘  └──────────┘  └──────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘`;
}
