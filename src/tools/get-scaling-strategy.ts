/**
 * get_scaling_strategy 도구 핸들러
 * 확장 전략 제안
 */

import { Platform } from "../types/index.js";

interface ScalingInput {
  currentDau: number;
  targetDau: number;
  platform: Platform;
  currentArchitecture?: string;
}

export async function handleGetScalingStrategy(args: unknown) {
  const input = args as ScalingInput;

  if (!input.currentDau || !input.targetDau || !input.platform) {
    return {
      content: [
        {
          type: "text",
          text: `필수 입력값이 누락되었습니다.

필수 항목:
- currentDau: 현재 DAU
- targetDau: 목표 DAU
- platform: 클라우드 플랫폼 (aws, gcp, naver-cloud)`,
        },
      ],
    };
  }

  const growthFactor = input.targetDau / input.currentDau;
  const strategy = generateScalingStrategy(input, growthFactor);

  return {
    content: [
      {
        type: "text",
        text: `## 확장 전략 제안

### 현재 → 목표
- **현재 DAU**: ${input.currentDau.toLocaleString()}명
- **목표 DAU**: ${input.targetDau.toLocaleString()}명
- **성장률**: ${growthFactor.toFixed(1)}배

---

${strategy}

---

### 확장 체크리스트

${generateScalingChecklist(growthFactor)}

---

### 모니터링 지표

확장 시점 판단을 위해 모니터링해야 할 핵심 지표:

| 지표 | 임계값 | 액션 |
|------|--------|------|
| CPU 사용률 | > 70% (5분 평균) | 스케일 아웃 |
| 메모리 사용률 | > 80% | 스케일 업 고려 |
| DB 연결 수 | > 80% of max | Connection Pool 확대 |
| 응답 시간 (P99) | > 500ms | 병목 분석 |
| 에러율 | > 1% | 긴급 대응 |

---

### 비용 영향 예측

| 단계 | DAU | 예상 월 비용 |
|------|-----|-------------|
| 현재 | ${input.currentDau.toLocaleString()} | $${estimateCostByDau(input.currentDau)} |
| 중간 | ${Math.round(input.currentDau + (input.targetDau - input.currentDau) / 2).toLocaleString()} | $${estimateCostByDau(Math.round(input.currentDau + (input.targetDau - input.currentDau) / 2))} |
| 목표 | ${input.targetDau.toLocaleString()} | $${estimateCostByDau(input.targetDau)} |`,
      },
    ],
  };
}

function generateScalingStrategy(input: ScalingInput, growthFactor: number): string {
  const strategies: string[] = [];

  // 2배 미만 성장
  if (growthFactor < 2) {
    strategies.push(`### 1단계: 수평 확장 (현재 → ${input.targetDau.toLocaleString()} DAU)

**컴퓨팅**
- Auto Scaling 그룹 max 인스턴스 수 증가
- CPU 임계값 70% → 60%로 조정 (여유 확보)

**데이터베이스**
- Read Replica 추가 고려
- Connection Pool 크기 증가

**캐시**
- 캐시 적중률 모니터링
- 필요 시 캐시 인스턴스 확대

**예상 비용 증가**: ~${Math.round((growthFactor - 1) * 100)}%`);
  }
  // 2~5배 성장
  else if (growthFactor < 5) {
    strategies.push(`### 1단계: 수평 확장 강화

**컴퓨팅**
- Auto Scaling min/max 인스턴스 수 증가
- 인스턴스 타입 업그레이드 고려

**데이터베이스**
- Read Replica 추가 (읽기 분산)
- 인스턴스 타입 스케일 업

**캐시**
- Redis 클러스터 모드 고려
- 캐시 전략 최적화

---

### 2단계: 아키텍처 개선 (${Math.round(input.targetDau * 0.7).toLocaleString()} DAU 도달 시)

**컴퓨팅**
- ${input.platform === "aws" ? "ECS → EKS" : "Cloud Run → GKE"} 마이그레이션 고려
- 서비스 분리 (모놀리스 → 마이크로서비스)

**데이터베이스**
- ${input.platform === "aws" ? "RDS → Aurora" : "Cloud SQL → Spanner"} 전환 고려
- 읽기/쓰기 분리

**CDN**
- 정적 컨텐츠 CDN 활용 극대화
- 캐시 TTL 최적화`);
  }
  // 5~10배 성장
  else if (growthFactor < 10) {
    strategies.push(`### 1단계: 즉시 조치

**컴퓨팅**
- 인스턴스 수 및 타입 증가
- Auto Scaling 정책 적극적으로 조정

**데이터베이스**
- Read Replica 다수 추가
- 인스턴스 대폭 업그레이드

---

### 2단계: 아키텍처 전환 (필수)

**컴퓨팅**
- Kubernetes(EKS/GKE) 전환
- 마이크로서비스 아키텍처 도입

**데이터베이스**
- ${input.platform === "aws" ? "Aurora" : "Cloud Spanner"} 전환
- 샤딩 전략 수립

**캐시**
- Redis 클러스터
- 캐시 계층 다중화

---

### 3단계: 글로벌 확장 준비

**멀티 리전**
- 리전별 배포 검토
- 데이터 동기화 전략

**CDN**
- 글로벌 CDN 활용
- 엣지 캐싱`);
  }
  // 10배 이상 성장
  else {
    strategies.push(`### 경고: 대규모 확장 필요

현재 대비 ${growthFactor.toFixed(1)}배 성장은 아키텍처 전면 재설계가 필요합니다.

---

### 1단계: 긴급 확장

- 모든 리소스 최대로 확장
- 병목 지점 긴급 파악

---

### 2단계: 아키텍처 재설계 (필수)

**컴퓨팅**
- Kubernetes 기반 오케스트레이션 필수
- 마이크로서비스 분리 필수
- 서비스 메시 도입 (Istio 등)

**데이터베이스**
- 분산 데이터베이스 도입
- 샤딩 필수
- CQRS 패턴 고려

**메시징**
- 이벤트 기반 아키텍처 도입
- 메시지 큐 (SQS, Pub/Sub) 활용

---

### 3단계: 글로벌 인프라

- 멀티 리전 필수
- 글로벌 로드밸런싱
- 데이터 복제 전략

---

### 권장 사항
이 규모의 성장에는 **전담 DevOps/SRE 팀**이 필요합니다.`);
  }

  return strategies.join("\n\n");
}

function generateScalingChecklist(growthFactor: number): string {
  const checklist = [
    "- [ ] Auto Scaling 정책 검토 및 조정",
    "- [ ] 로드 테스트 실행 (목표 트래픽의 1.5배)",
    "- [ ] 데이터베이스 성능 테스트",
    "- [ ] 캐시 적중률 분석",
    "- [ ] 모니터링 알람 임계값 조정",
    "- [ ] 비용 예산 검토",
  ];

  if (growthFactor >= 2) {
    checklist.push(
      "- [ ] Read Replica 추가 계획",
      "- [ ] Connection Pool 설정 검토"
    );
  }

  if (growthFactor >= 5) {
    checklist.push(
      "- [ ] 마이크로서비스 분리 계획",
      "- [ ] Kubernetes 마이그레이션 검토",
      "- [ ] 데이터베이스 확장 전략 수립"
    );
  }

  if (growthFactor >= 10) {
    checklist.push(
      "- [ ] 아키텍처 재설계 TF 구성",
      "- [ ] 멀티 리전 전략 수립",
      "- [ ] DevOps/SRE 팀 확대"
    );
  }

  return checklist.join("\n");
}

function estimateCostByDau(dau: number): number {
  // 간단한 비용 추정 (DAU 기반)
  if (dau < 100) return 50;
  if (dau < 500) return 80;
  if (dau < 1000) return 120;
  if (dau < 5000) return 300;
  if (dau < 10000) return 600;
  if (dau < 50000) return 1500;
  if (dau < 100000) return 3000;
  return Math.round(dau * 0.05);
}
