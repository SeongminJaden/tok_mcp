/**
 * CPU 아키텍처 추천 로직
 */

import { Platform, CpuArchitecture } from "../types/index.js";

export interface CpuRecommendation {
  architecture: CpuArchitecture;
  reason: string;
  costSaving: string;
  recommendedInstance: string;
  constraints: string[];
}

type WorkloadType =
  | "web-api"
  | "ml-inference"
  | "ml-training"
  | "hpc"
  | "legacy"
  | "container"
  | "general";

const recommendations: Record<WorkloadType, Record<Platform, CpuRecommendation>> = {
  "web-api": {
    aws: {
      architecture: "arm64",
      reason:
        "웹/API 서버는 I/O 바운드 워크로드로, ARM(Graviton)이 비용 대비 성능이 우수합니다. " +
        "대부분의 언어/프레임워크가 ARM을 네이티브 지원합니다.",
      costSaving: "x86 대비 ~40% 비용 절감",
      recommendedInstance: "t4g.micro, t4g.small (소규모) / c7g.medium (중규모)",
      constraints: [
        "ARM64 빌드가 필요합니다 (Docker buildx 또는 ARM 빌드 환경)",
        "일부 native 바이너리 의존성은 ARM 버전 확인 필요",
        "Node.js, Python, Go, Java 등 주요 런타임 모두 지원",
      ],
    },
    gcp: {
      architecture: "arm64",
      reason:
        "GCP Tau T2A 인스턴스는 ARM 기반으로 비용 효율적입니다. " +
        "Cloud Run도 ARM 지원을 시작했습니다.",
      costSaving: "x86 대비 ~30% 비용 절감",
      recommendedInstance: "t2a-standard-1 (소규모) / t2a-standard-2 (중규모)",
      constraints: [
        "ARM64 컨테이너 이미지 필요",
        "일부 리전에서만 사용 가능",
        "Cloud Run은 ARM 지원 확인 필요",
      ],
    },
    "naver-cloud": {
      architecture: "x86_64",
      reason: "Naver Cloud는 현재 x86 기반 인스턴스만 제공합니다.",
      costSaving: "N/A",
      recommendedInstance: "s-g2 (소규모) / m-g2 (중규모)",
      constraints: ["ARM 인스턴스 미지원", "x86 기반 이미지 사용"],
    },
    "on-premise": {
      architecture: "x86_64",
      reason: "온프레미스 환경에서는 기존 x86 서버를 활용하는 것이 일반적입니다.",
      costSaving: "N/A",
      recommendedInstance: "기존 서버 활용",
      constraints: ["하드웨어에 따라 결정"],
    },
  },
  "ml-inference": {
    aws: {
      architecture: "arm64",
      reason:
        "ML 추론 워크로드는 ARM(Graviton)에서 비용 대비 처리량이 우수합니다. " +
        "PyTorch, TensorFlow 모두 ARM 지원.",
      costSaving: "x86 대비 ~40% 비용 절감",
      recommendedInstance: "c7g.medium (소규모) / c7g.large (중규모)",
      constraints: [
        "모델을 ARM용으로 변환 또는 재빌드 필요",
        "ONNX Runtime ARM 지원",
        "일부 커스텀 연산자는 호환성 확인 필요",
      ],
    },
    gcp: {
      architecture: "arm64",
      reason: "GCP Tau T2A로 비용 효율적인 추론 가능.",
      costSaving: "x86 대비 ~30% 비용 절감",
      recommendedInstance: "t2a-standard-2 / t2a-standard-4",
      constraints: ["TensorFlow, PyTorch ARM 버전 사용"],
    },
    "naver-cloud": {
      architecture: "x86_64",
      reason: "Naver Cloud에서는 x86 기반 추론 서버 사용.",
      costSaving: "N/A",
      recommendedInstance: "g-g2 (GPU 필요 시)",
      constraints: ["x86 기반 모델 사용"],
    },
    "on-premise": {
      architecture: "x86_64",
      reason: "기존 하드웨어 활용.",
      costSaving: "N/A",
      recommendedInstance: "기존 서버",
      constraints: ["하드웨어 의존"],
    },
  },
  "ml-training": {
    aws: {
      architecture: "x86_64_gpu",
      reason:
        "ML 학습에는 GPU가 필수입니다. CUDA는 x86에서만 완전 지원됩니다.",
      costSaving: "Spot 인스턴스 활용 시 ~70% 절감 가능",
      recommendedInstance: "p3.2xlarge (V100) / p4d.24xlarge (A100)",
      constraints: [
        "CUDA 호환 GPU 필수",
        "GPU 인스턴스는 ARM 미지원",
        "Spot 인스턴스로 비용 최적화 권장",
      ],
    },
    gcp: {
      architecture: "x86_64_gpu",
      reason: "GPU 가속을 위해 x86 + NVIDIA GPU 조합 필요.",
      costSaving: "Preemptible VM으로 ~70% 절감",
      recommendedInstance: "n1-standard-8 + V100 / a2-highgpu-1g",
      constraints: ["CUDA, cuDNN 필요", "GPU 할당량 확인 필요"],
    },
    "naver-cloud": {
      architecture: "x86_64_gpu",
      reason: "GPU 서버로 학습.",
      costSaving: "N/A",
      recommendedInstance: "g-g2",
      constraints: ["GPU 인스턴스 사용"],
    },
    "on-premise": {
      architecture: "x86_64_gpu",
      reason: "GPU 워크스테이션 또는 서버.",
      costSaving: "N/A",
      recommendedInstance: "NVIDIA GPU 탑재 서버",
      constraints: ["GPU 하드웨어 필요"],
    },
  },
  hpc: {
    aws: {
      architecture: "x86_64",
      reason:
        "고성능 컴퓨팅(HPC)은 단일 스레드 성능이 중요하여 x86이 유리합니다.",
      costSaving: "Spot 인스턴스 활용 권장",
      recommendedInstance: "c6i.xlarge / hpc6a.48xlarge",
      constraints: [
        "컴파일러 최적화 필요",
        "MPI 라이브러리 호환성 확인",
        "EFA(Elastic Fabric Adapter) 활용 고려",
      ],
    },
    gcp: {
      architecture: "x86_64",
      reason: "HPC 워크로드용 컴퓨팅 최적화 인스턴스 사용.",
      costSaving: "Preemptible VM 활용",
      recommendedInstance: "c2-standard-60 / h3-standard-88",
      constraints: ["고성능 네트워킹 구성 필요"],
    },
    "naver-cloud": {
      architecture: "x86_64",
      reason: "고성능 컴퓨팅용 인스턴스.",
      costSaving: "N/A",
      recommendedInstance: "c-g3",
      constraints: ["x86 기반"],
    },
    "on-premise": {
      architecture: "x86_64",
      reason: "HPC 클러스터.",
      costSaving: "N/A",
      recommendedInstance: "HPC 클러스터",
      constraints: ["전용 하드웨어"],
    },
  },
  legacy: {
    aws: {
      architecture: "x86_64",
      reason:
        "레거시 애플리케이션은 x86 바이너리 호환성이 필요합니다. " +
        "포팅 비용 대비 x86 유지가 효율적일 수 있습니다.",
      costSaving: "Reserved Instance로 최대 ~60% 절감",
      recommendedInstance: "t3.small / m5.large",
      constraints: [
        "ARM 포팅 시 상당한 테스트 필요",
        "서드파티 의존성 호환성 확인",
        "기존 바이너리 그대로 사용 가능",
      ],
    },
    gcp: {
      architecture: "x86_64",
      reason: "레거시 호환성을 위해 x86 사용.",
      costSaving: "CUD(Committed Use Discount)로 할인",
      recommendedInstance: "e2-medium / n1-standard-2",
      constraints: ["x86 바이너리 호환"],
    },
    "naver-cloud": {
      architecture: "x86_64",
      reason: "레거시 애플리케이션 호환.",
      costSaving: "N/A",
      recommendedInstance: "s-g2 / m-g2",
      constraints: ["x86 기반"],
    },
    "on-premise": {
      architecture: "x86_64",
      reason: "기존 하드웨어 활용.",
      costSaving: "N/A",
      recommendedInstance: "기존 서버",
      constraints: ["하드웨어 의존"],
    },
  },
  container: {
    aws: {
      architecture: "arm64",
      reason:
        "컨테이너 워크로드는 ARM(Graviton)에서 탁월한 비용 효율을 보입니다. " +
        "Docker, Kubernetes 모두 ARM 네이티브 지원.",
      costSaving: "x86 대비 ~40% 비용 절감",
      recommendedInstance: "t4g.small (ECS) / m7g.medium (EKS)",
      constraints: [
        "멀티 아키텍처 이미지 빌드 권장 (docker buildx)",
        "베이스 이미지 ARM 버전 확인",
        "대부분의 공식 이미지는 ARM 지원",
      ],
    },
    gcp: {
      architecture: "arm64",
      reason: "GKE Autopilot에서 ARM 노드 지원.",
      costSaving: "x86 대비 ~30% 비용 절감",
      recommendedInstance: "t2a-standard-1 / t2a-standard-2",
      constraints: [
        "멀티 아키텍처 이미지 필요",
        "ARM 노드풀 별도 구성",
      ],
    },
    "naver-cloud": {
      architecture: "x86_64",
      reason: "Naver Cloud Kubernetes Service는 x86 노드 사용.",
      costSaving: "N/A",
      recommendedInstance: "m-g2",
      constraints: ["x86 이미지 사용"],
    },
    "on-premise": {
      architecture: "x86_64",
      reason: "기존 하드웨어에서 Docker/K8s 운영.",
      costSaving: "N/A",
      recommendedInstance: "기존 서버",
      constraints: ["하드웨어 의존"],
    },
  },
  general: {
    aws: {
      architecture: "arm64",
      reason:
        "신규 프로젝트는 ARM(Graviton)으로 시작하는 것을 권장합니다. " +
        "비용 효율이 높고 대부분의 워크로드에서 잘 동작합니다.",
      costSaving: "x86 대비 ~40% 비용 절감",
      recommendedInstance: "t4g.micro (시작) / t4g.small (성장)",
      constraints: [
        "ARM 빌드 환경 구축",
        "의존성 ARM 호환 확인",
        "CI/CD에서 ARM 빌드 추가",
      ],
    },
    gcp: {
      architecture: "arm64",
      reason: "신규 프로젝트는 ARM 기반 시작 권장.",
      costSaving: "x86 대비 ~30% 비용 절감",
      recommendedInstance: "t2a-standard-1",
      constraints: ["ARM 이미지 준비"],
    },
    "naver-cloud": {
      architecture: "x86_64",
      reason: "x86 기반 인프라 사용.",
      costSaving: "N/A",
      recommendedInstance: "s-g2",
      constraints: ["x86 전용"],
    },
    "on-premise": {
      architecture: "x86_64",
      reason: "기존 하드웨어 활용.",
      costSaving: "N/A",
      recommendedInstance: "기존 서버",
      constraints: ["하드웨어 의존"],
    },
  },
};

export function recommendCpuArchitecture(
  workloadType: WorkloadType,
  platform: Platform = "aws"
): CpuRecommendation {
  const workload = recommendations[workloadType] || recommendations["general"];
  return workload[platform] || workload["aws"];
}
