# 아키텍처 문서

## 개요

- **서비스**: teamnotes
- **플랫폼**: AWS
- **리전**: ap-northeast-2
- **생성일**: 2026-11-26

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    Users                                                    │
│      │                                                      │
│      ▼                                                      │
│  route53    ──▶ cloudfront   ──▶ ALB                │
│                                       │                     │
│                                       ▼                     │
│                            ┌──────────────────┐            │
│                            │  ecs-fargate     │            │
│                            │  (arm64)       │            │
│                            │  Auto Scaling    │            │
│                            └────────┬─────────┘            │
│                                     │                      │
│               ┌─────────────────────┼────────────────┐     │
│               ▼                     ▼                ▼     │
│        ┌──────────┐          ┌──────────┐     ┌──────────┐│
│        │  rds     │          │  elasticache│     │  s3      ││
│        │postgresql│          │  Cache   │     │ Storage ││
│        └──────────┘          └──────────┘     └──────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 구성 요소

### 컴퓨팅

| 항목 | 값 |
|------|-----|
| 서비스 | ecs-fargate |
| CPU 아키텍처 | arm64 |
| 사양 | 0.5vCPU, 1GB |
| 인스턴스 수 | 1 ~ 4 |
| 오토스케일링 | cpu 70% |

### 데이터베이스

| 항목 | 값 |
|------|-----|
| 타입 | postgresql |
| 서비스 | rds |
| 인스턴스 | db.t4g.small |
| 스토리지 | 50GB |
| Multi-AZ | 비활성화 |

### 캐시

| 항목 | 값 |
|------|-----|
| 타입 | redis |
| 서비스 | elasticache |
| 인스턴스 | cache.t4g.micro |


### 네트워킹

| 항목 | 값 |
|------|-----|
| 로드밸런서 | alb |
| DNS | route53 |
| SSL | acm |

---

## 설계 결정 사항 (ADR)

### 1. ecs-fargate 선택

**이유**: 테넌트별 격리 없이 공유 인프라

### 2. arm64 아키텍처

**이유**: 웹/API 서버는 I/O 바운드 워크로드로, ARM(Graviton)이 비용 대비 성능이 우수합니다. 대부분의 언어/프레임워크가 ARM을 네이티브 지원합니다.

### 3. postgresql 데이터베이스

**이유**: 멀티테넌시 데이터 증가 대비

### 4. 테넌트 격리 모델 검토

**이유**: 공유 리소스(pool)는 테넌트별 접근 제어와 사용량 관측이 필요합니다. 전용 리소스 요구가 있는 고객은 silo 또는 일부 계층만 분리하는 bridge 모델을 검토하세요. [AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html)


---

## 예상 비용

| 항목 | 월 비용 (USD) |
|------|--------------|
| 컴퓨팅 | $16.58 |
| 데이터베이스 | $43.78 |
| 캐시 | $17.52 |
| 스토리지 | $1.25 |
| 네트워킹 | $16.43 |
| **합계** | **$95.56** |

> 2026-11-26 서울 공개 단가(USD), 월 730시간, 구성된 객체 저장소 50GB, 로드밸런서 1개 기본료 기준. 트래픽·요청·LCU·공인 IP·백업·세금·할인은 제외합니다.

---

## 확장 전략

1. 테넌트 100개: 현재 구성 유지
2. 테넌트 200개: DB 스케일업
3. 테넌트 500개: 테넌트별 스키마 분리 고려

---

## 개발 가이드

### 기술 스택

- **언어**: typescript
- **프레임워크**: express
- **ORM**: prisma

### 프로젝트 구조

```
src/api/ - API 엔드포인트
src/services/ - 비즈니스 로직
src/repositories/ - 데이터 접근
src/models/ - 타입 정의
```

### 환경 변수

```
DATABASE_URL
REDIS_URL
AWS_REGION
AWS_S3_BUCKET
```

### 개발 패턴

- REST API with OpenAPI spec
- Repository pattern for data access
- Structured JSON logging
- Health check endpoint at /health

### 제약사항

- ARM64 빌드가 필요합니다 (Docker buildx 또는 ARM 빌드 환경)
- 일부 native 바이너리 의존성은 ARM 버전 확인 필요
- Node.js, Python, Go, Java 등 주요 런타임 모두 지원

---

## 참고 자료

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Solutions Library](https://aws.amazon.com/solutions/)

---

*이 문서는 tok_mcp에 의해 자동 생성되었습니다.*
