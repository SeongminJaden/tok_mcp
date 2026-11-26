# 아키텍처 문서

## 개요

- **서비스**: team-board
- **플랫폼**: AWS
- **리전**: ap-northeast-2
- **생성일**: 2026-11-26
- **배포 방식**: server
- **DB 계획**: required

---

## 아키텍처 다이어그램

```
route53 → alb → ecs-fargate
ecs-fargate → rds
ecs-fargate → elasticache
ecs-fargate → s3
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
| 인스턴스 | db.t4g.micro |
| 스토리지 | 20GB |
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

**이유**: 서버리스로 관리 부담 없이 오토스케일링

### 2. arm64 아키텍처

**이유**: 웹/API 서버는 I/O 바운드 워크로드로, ARM(Graviton)이 비용 대비 성능이 우수합니다. 대부분의 언어/프레임워크가 ARM을 네이티브 지원합니다.

### 3. postgresql 데이터베이스

**이유**: 비용 효율적인 Graviton 기반 인스턴스


---

## 예상 비용

| 항목 | 월 비용 (USD) |
|------|--------------|
| 컴퓨팅 | $16.58 |
| 데이터베이스 | $20.87 |
| 캐시 | $17.52 |
| 스토리지 | $1.25 |
| 네트워킹 | $16.43 |
| **합계** | **$72.65** |

> 2026-11-26 서울 공개 단가(USD), 월 730시간, 구성된 객체 저장소 50GB, 로드밸런서 1개 기본료 기준. 트래픽·요청·LCU·공인 IP·백업·세금·할인은 제외합니다.

---

## 확장 전략

1. DAU 1,000: 현재 구성 유지
2. DAU 2,000: ECS 태스크 max 증가
3. DAU 5,000: RDS 인스턴스 업그레이드

---

## 개발 가이드

### 스타터에서 확인한 값
- 언어: typescript
- 프레임워크: Next.js (Pages Router), tRPC
- ORM: Prisma
- 경로: prisma/schema.prisma
- 경로: src/server/db.ts
- 경로: src/pages/index.tsx

### 기술 스택

- **언어**: typescript
- **프레임워크**: Next.js (Pages Router), tRPC
- **ORM**: Prisma

### 프로젝트 구조

```
prisma/schema.prisma
src/server/db.ts
src/pages/index.tsx
```

### 환경 변수

```
DATABASE_URL
REDIS_URL
AWS_REGION
AWS_S3_BUCKET
```

### 개발 패턴



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
