/**
 * recommend_cpu_arch 도구 핸들러
 * 워크로드에 따른 CPU 아키텍처 추천
 */

import { Platform } from "../types/index.js";
import { recommendCpuArchitecture, CpuRecommendation } from "../data/cpu-arch.js";

type WorkloadType =
  | "web-api"
  | "ml-inference"
  | "ml-training"
  | "hpc"
  | "legacy"
  | "container"
  | "general";

interface CpuArchInput {
  workloadType: WorkloadType;
  platform?: Platform;
}

export async function handleRecommendCpuArch(args: unknown) {
  const input = args as CpuArchInput;

  if (!input.workloadType) {
    return {
      content: [
        {
          type: "text",
          text: `필수 입력값이 누락되었습니다.

필수 항목:
- workloadType: 워크로드 유형
  - web-api: 웹/API 서버
  - ml-inference: ML 추론
  - ml-training: ML 학습
  - hpc: 고성능 컴퓨팅
  - legacy: 레거시 앱
  - container: 컨테이너 워크로드
  - general: 범용`,
        },
      ],
    };
  }

  const platform = input.platform || "aws";
  const recommendation = recommendCpuArchitecture(input.workloadType, platform);

  const comparisonTable = generateComparisonTable(input.workloadType, platform);

  return {
    content: [
      {
        type: "text",
        text: `## CPU 아키텍처 추천

### 워크로드: ${input.workloadType}
### 플랫폼: ${platform.toUpperCase()}

---

### 추천 결과

| 항목 | 값 |
|------|-----|
| **추천 아키텍처** | **${recommendation.architecture}** |
| **추천 인스턴스** | ${recommendation.recommendedInstance} |
| **비용 절감** | ${recommendation.costSaving} |

### 추천 이유
${recommendation.reason}

---

### 아키텍처 비교

${comparisonTable}

---

### 제약사항 및 고려사항

${recommendation.constraints.map((c) => `- ${c}`).join("\n")}

---

### 사용 가능한 인스턴스 타입

#### ARM (Graviton)
${
  platform === "aws"
    ? `- **범용**: t4g.micro, t4g.small, t4g.medium
- **컴퓨팅 최적화**: c7g.medium, c7g.large
- **메모리 최적화**: r7g.medium, r7g.large`
    : platform === "gcp"
    ? `- **범용**: t2a-standard-1, t2a-standard-2
- **컴퓨팅 최적화**: c2a-standard-2`
    : `- Naver Cloud는 현재 x86만 지원`
}

#### x86 (Intel/AMD)
${
  platform === "aws"
    ? `- **범용**: t3.micro, t3.small, t3.medium
- **컴퓨팅 최적화**: c6i.large, c6i.xlarge
- **메모리 최적화**: r6i.large, r6i.xlarge`
    : platform === "gcp"
    ? `- **범용**: e2-micro, e2-small, e2-medium
- **컴퓨팅 최적화**: c2-standard-4`
    : `- **범용**: s-g2, s-g3
- **컴퓨팅 최적화**: c-g2, c-g3`
}`,
      },
    ],
  };
}

function generateComparisonTable(workloadType: WorkloadType, platform: Platform): string {
  const arm = platform === "aws" ? "Graviton" : platform === "gcp" ? "Tau T2A" : "N/A";

  const comparisons: Record<WorkloadType, { arm: string; x86: string; winner: string }> = {
    "web-api": {
      arm: "비용 40% 절감, 전력 효율",
      x86: "범용성, 호환성",
      winner: "ARM",
    },
    "ml-inference": {
      arm: "비용 대비 처리량 우수",
      x86: "일부 라이브러리 호환성",
      winner: "ARM",
    },
    "ml-training": {
      arm: "제한적 지원",
      x86: "CUDA, GPU 지원",
      winner: "x86 + GPU",
    },
    hpc: {
      arm: "전력 효율",
      x86: "단일 스레드 성능",
      winner: "x86",
    },
    legacy: {
      arm: "포팅 필요",
      x86: "바이너리 호환",
      winner: "x86",
    },
    container: {
      arm: "네이티브 지원, 비용 절감",
      x86: "범용성",
      winner: "ARM",
    },
    general: {
      arm: "비용 효율",
      x86: "호환성",
      winner: "ARM (신규 프로젝트)",
    },
  };

  const comp = comparisons[workloadType];

  return `| 아키텍처 | 장점 |
|----------|------|
| **ARM (${arm})** | ${comp.arm} |
| **x86 (Intel/AMD)** | ${comp.x86} |

**추천**: ${comp.winner}`;
}
