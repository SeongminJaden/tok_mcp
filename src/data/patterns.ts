/**
 * 아키텍처 패턴 데이터
 * AWS/GCP/Naver Cloud 모범 사례 기반
 */

import { Platform, ServiceType, Scale } from "../types/index.js";

export interface ArchitecturePattern {
  compute: {
    service: string;
    cpu: string;
    memory: string;
    minInstances: number;
    maxInstances: number;
    reason: string;
  };
  database: {
    type: "postgresql" | "mysql" | "mongodb" | "dynamodb";
    service: string;
    instance: string;
    storage: number;
    reason: string;
  };
  cache?: {
    type: "redis" | "memcached";
    service: string;
    instance: string;
  };
  storage?: {
    service: string;
    cdn?: string;
  };
  networking: {
    loadBalancer: string;
    dns: string;
    ssl: string;
  };
  scalingStrategy: string[];
}

// AWS 패턴
const awsPatterns: Record<ServiceType, Record<Scale, ArchitecturePattern>> = {
  "web-api": {
    mvp: {
      compute: {
        service: "ecs-fargate",
        cpu: "0.25vCPU",
        memory: "0.5GB",
        minInstances: 1,
        maxInstances: 2,
        reason: "서버리스로 운영 부담 최소화, 소규모에 적합",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.micro",
        storage: 20,
        reason: "범용성 높은 PostgreSQL, 무료 티어 활용 가능",
      },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: ["현재 구성으로 DAU 100명까지 대응 가능"],
    },
    small: {
      compute: {
        service: "ecs-fargate",
        cpu: "0.5vCPU",
        memory: "1GB",
        minInstances: 1,
        maxInstances: 4,
        reason: "서버리스로 관리 부담 없이 오토스케일링",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.micro",
        storage: 20,
        reason: "비용 효율적인 Graviton 기반 인스턴스",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.micro" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "DAU 1,000: 현재 구성 유지",
        "DAU 2,000: ECS 태스크 max 증가",
        "DAU 5,000: RDS 인스턴스 업그레이드",
      ],
    },
    medium: {
      compute: {
        service: "ecs-fargate",
        cpu: "1vCPU",
        memory: "2GB",
        minInstances: 2,
        maxInstances: 10,
        reason: "안정적인 가용성 확보, 스케일링 여유",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.small",
        storage: 50,
        reason: "읽기 워크로드 증가 대비",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.small" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "DAU 10,000: Read Replica 추가",
        "DAU 20,000: Aurora 전환 고려",
        "DAU 50,000: EKS 마이그레이션 검토",
      ],
    },
    large: {
      compute: {
        service: "eks",
        cpu: "2vCPU",
        memory: "4GB",
        minInstances: 3,
        maxInstances: 20,
        reason: "Kubernetes로 복잡한 워크로드 관리",
      },
      database: {
        type: "postgresql",
        service: "aurora",
        instance: "db.r6g.large",
        storage: 100,
        reason: "Aurora의 자동 확장 및 고가용성",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.large" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "DAU 100,000: Aurora Auto Scaling 활성화",
        "DAU 200,000: 멀티 리전 고려",
        "DAU 500,000: 샤딩 전략 도입",
      ],
    },
    enterprise: {
      compute: {
        service: "eks",
        cpu: "4vCPU",
        memory: "8GB",
        minInstances: 5,
        maxInstances: 50,
        reason: "대규모 트래픽 처리를 위한 Kubernetes",
      },
      database: {
        type: "postgresql",
        service: "aurora",
        instance: "db.r6g.xlarge",
        storage: 500,
        reason: "글로벌 규모의 데이터 처리",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.xlarge" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "멀티 리전 Active-Active 구성",
        "글로벌 데이터베이스 활용",
        "마이크로서비스 아키텍처 필수",
      ],
    },
  },
  saas: {
    mvp: {
      compute: {
        service: "ecs-fargate",
        cpu: "0.5vCPU",
        memory: "1GB",
        minInstances: 1,
        maxInstances: 2,
        reason: "SaaS 초기 단계, 빠른 시작",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.micro",
        storage: 20,
        reason: "멀티테넌시 지원 용이한 PostgreSQL",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.micro" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: ["테넌트 수 50개까지 현재 구성 유지"],
    },
    small: {
      compute: {
        service: "ecs-fargate",
        cpu: "0.5vCPU",
        memory: "1GB",
        minInstances: 1,
        maxInstances: 4,
        reason: "테넌트별 격리 없이 공유 인프라",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.small",
        storage: 50,
        reason: "멀티테넌시 데이터 증가 대비",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.micro" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "테넌트 100개: 현재 구성 유지",
        "테넌트 200개: DB 스케일업",
        "테넌트 500개: 테넌트별 스키마 분리 고려",
      ],
    },
    medium: {
      compute: {
        service: "ecs-fargate",
        cpu: "1vCPU",
        memory: "2GB",
        minInstances: 2,
        maxInstances: 10,
        reason: "테넌트 증가에 따른 확장성",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.medium",
        storage: 100,
        reason: "테넌트별 데이터 격리",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.small" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "테넌트 500개: Read Replica 추가",
        "테넌트 1,000개: Aurora 전환",
        "대형 테넌트: 전용 인스턴스 고려",
      ],
    },
    large: {
      compute: {
        service: "eks",
        cpu: "2vCPU",
        memory: "4GB",
        minInstances: 3,
        maxInstances: 20,
        reason: "대규모 멀티테넌시 관리",
      },
      database: {
        type: "postgresql",
        service: "aurora",
        instance: "db.r6g.large",
        storage: 200,
        reason: "Aurora로 자동 확장",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.large" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "테넌트별 데이터베이스 분리",
        "대형 테넌트 전용 클러스터",
        "셀 기반 아키텍처 도입",
      ],
    },
    enterprise: {
      compute: {
        service: "eks",
        cpu: "4vCPU",
        memory: "8GB",
        minInstances: 5,
        maxInstances: 50,
        reason: "엔터프라이즈급 SaaS",
      },
      database: {
        type: "postgresql",
        service: "aurora",
        instance: "db.r6g.xlarge",
        storage: 500,
        reason: "글로벌 멀티테넌시",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.xlarge" },
      storage: { service: "s3", cdn: "cloudfront" },
      networking: { loadBalancer: "alb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "리전별 셀 아키텍처",
        "테넌트별 전용 인프라 옵션",
        "데이터 레지던시 준수",
      ],
    },
  },
  game: {
    mvp: {
      compute: {
        service: "ec2",
        cpu: "2vCPU",
        memory: "4GB",
        minInstances: 1,
        maxInstances: 2,
        reason: "게임 서버는 지속 연결 필요, EC2 적합",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.small",
        storage: 50,
        reason: "게임 데이터 저장",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.small" },
      storage: { service: "s3" },
      networking: { loadBalancer: "nlb", dns: "route53", ssl: "acm" },
      scalingStrategy: ["동시접속 100명까지 단일 서버로 대응"],
    },
    small: {
      compute: {
        service: "ec2",
        cpu: "4vCPU",
        memory: "8GB",
        minInstances: 1,
        maxInstances: 4,
        reason: "게임 로직 처리를 위한 충분한 리소스",
      },
      database: {
        type: "postgresql",
        service: "rds",
        instance: "db.t4g.medium",
        storage: 100,
        reason: "게임 상태 및 유저 데이터",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.t4g.medium" },
      storage: { service: "s3" },
      networking: { loadBalancer: "nlb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "동시접속 1,000명: 서버 2대로 분산",
        "동시접속 2,000명: 매치메이킹 서버 분리",
      ],
    },
    medium: {
      compute: {
        service: "gamelift",
        cpu: "4vCPU",
        memory: "16GB",
        minInstances: 2,
        maxInstances: 20,
        reason: "GameLift로 게임 서버 관리 자동화",
      },
      database: {
        type: "dynamodb",
        service: "dynamodb",
        instance: "on-demand",
        storage: 0,
        reason: "게임 상태의 빠른 읽기/쓰기",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.large" },
      storage: { service: "s3" },
      networking: { loadBalancer: "nlb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "GameLift FleetIQ로 스팟 인스턴스 활용",
        "리전별 서버 배치",
        "플레이어 대기열 관리",
      ],
    },
    large: {
      compute: {
        service: "gamelift",
        cpu: "8vCPU",
        memory: "32GB",
        minInstances: 5,
        maxInstances: 100,
        reason: "대규모 동시접속 처리",
      },
      database: {
        type: "dynamodb",
        service: "dynamodb",
        instance: "on-demand",
        storage: 0,
        reason: "글로벌 테이블로 저지연",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.xlarge" },
      storage: { service: "s3" },
      networking: { loadBalancer: "nlb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "글로벌 GameLift 배포",
        "리전별 매치메이킹",
        "실시간 분석 파이프라인",
      ],
    },
    enterprise: {
      compute: {
        service: "gamelift",
        cpu: "16vCPU",
        memory: "64GB",
        minInstances: 10,
        maxInstances: 500,
        reason: "AAA급 게임 서비스",
      },
      database: {
        type: "dynamodb",
        service: "dynamodb",
        instance: "on-demand",
        storage: 0,
        reason: "글로벌 스케일",
      },
      cache: { type: "redis", service: "elasticache", instance: "cache.r6g.2xlarge" },
      storage: { service: "s3" },
      networking: { loadBalancer: "nlb", dns: "route53", ssl: "acm" },
      scalingStrategy: [
        "전세계 리전 배포",
        "크로스 리전 매치메이킹",
        "실시간 이벤트 처리",
      ],
    },
  },
  // 나머지 서비스 타입들 (기본 패턴 사용)
  messenger: {} as Record<Scale, ArchitecturePattern>,
  "ai-ml": {} as Record<Scale, ArchitecturePattern>,
  media: {} as Record<Scale, ArchitecturePattern>,
  iot: {} as Record<Scale, ArchitecturePattern>,
  ecommerce: {} as Record<Scale, ArchitecturePattern>,
  other: {} as Record<Scale, ArchitecturePattern>,
};

// 기본 패턴으로 나머지 채우기
const defaultPattern = awsPatterns["web-api"];
["messenger", "ai-ml", "media", "iot", "ecommerce", "other"].forEach((type) => {
  awsPatterns[type as ServiceType] = defaultPattern;
});

// GCP 패턴 (AWS 기반으로 변환)
function convertToGcp(pattern: ArchitecturePattern): ArchitecturePattern {
  return {
    ...pattern,
    compute: {
      ...pattern.compute,
      service: pattern.compute.service.replace("ecs-fargate", "cloud-run").replace("eks", "gke"),
    },
    database: {
      ...pattern.database,
      service: pattern.database.service.replace("rds", "cloud-sql").replace("aurora", "cloud-spanner"),
      instance: pattern.database.instance.replace("db.t4g", "db-f1").replace("db.r6g", "db-n1"),
    },
    cache: pattern.cache
      ? {
          ...pattern.cache,
          service: "memorystore",
          instance: pattern.cache.instance.replace("cache.t4g", "basic").replace("cache.r6g", "standard"),
        }
      : undefined,
    storage: pattern.storage
      ? {
          service: "gcs",
          cdn: "cloud-cdn",
        }
      : undefined,
    networking: {
      loadBalancer: "cloud-lb",
      dns: "cloud-dns",
      ssl: "managed-ssl",
    },
  };
}

export function getArchitecturePattern(
  platform: Platform,
  serviceType: ServiceType,
  scale: Scale
): ArchitecturePattern {
  const awsPattern = awsPatterns[serviceType]?.[scale] || awsPatterns["web-api"][scale];

  switch (platform) {
    case "aws":
      return awsPattern;
    case "gcp":
      return convertToGcp(awsPattern);
    case "naver-cloud":
      return {
        ...awsPattern,
        compute: {
          ...awsPattern.compute,
          service: "server",
        },
        database: {
          ...awsPattern.database,
          service: "cloud-db",
          instance: "m2-g2",
        },
        cache: awsPattern.cache
          ? {
              ...awsPattern.cache,
              service: "cloud-redis",
              instance: "m2-g1",
            }
          : undefined,
        storage: {
          service: "object-storage",
          cdn: "cdn+",
        },
        networking: {
          loadBalancer: "load-balancer",
          dns: "dns",
          ssl: "certificate-manager",
        },
      };
    case "on-premise":
      return {
        ...awsPattern,
        compute: {
          ...awsPattern.compute,
          service: "docker-compose",
          reason: "단일 서버에서 Docker로 구동",
        },
        database: {
          ...awsPattern.database,
          service: "docker-postgres",
        },
        cache: awsPattern.cache
          ? {
              ...awsPattern.cache,
              service: "docker-redis",
            }
          : undefined,
        storage: {
          service: "local-storage",
        },
        networking: {
          loadBalancer: "nginx",
          dns: "custom",
          ssl: "letsencrypt",
        },
      };
    default:
      return awsPattern;
  }
}
