/**
 * 아키텍처 관련 타입 정의
 */

// 클라우드 플랫폼
export type Platform = "aws" | "gcp" | "naver-cloud" | "on-premise";

// 서비스 유형
export type ServiceType =
  | "web-api"
  | "saas"
  | "game"
  | "messenger"
  | "ai-ml"
  | "media"
  | "iot"
  | "ecommerce"
  | "other";

// CPU 아키텍처
export type CpuArchitecture = "arm64" | "x86_64" | "x86_64_gpu";

// 규모
export type Scale = "mvp" | "small" | "medium" | "large" | "enterprise";

// 트래픽 패턴
export type TrafficPattern = "steady" | "peak" | "spike";

// 사용자 입력 데이터
export interface UserRequirements {
  platform: Platform;
  serviceType: ServiceType;
  description: string;
  dau: number; // Daily Active Users
  peakConcurrent: number; // 피크 동시 접속자
  dailyRequests: number; // 일일 요청 수
  dataStorageGB: number; // 데이터 저장량 (GB)
  growthRate: number; // 6개월 성장률 (%)
  trafficPattern: TrafficPattern;
  isGlobal: boolean;
  needsRealtime: boolean;
  needsFileUpload: boolean;
  needsAI: boolean;
  monthlyBudget: number; // 월 예산 (USD)
  needsDevEnvDocs: boolean; // 개발환경 문서 필요 여부
}

// 컴퓨팅 설정
export interface ComputeConfig {
  service: string; // ecs-fargate, eks, ec2, cloud-run, etc.
  cpuArch: CpuArchitecture;
  cpu: string; // 0.5vCPU, 1vCPU, etc.
  memory: string; // 1GB, 2GB, etc.
  minInstances: number;
  maxInstances: number;
  autoScaling: {
    metric: "cpu" | "memory" | "requests";
    targetValue: number;
  };
}

// 데이터베이스 설정
export interface DatabaseConfig {
  primary: {
    type: "postgresql" | "mysql" | "mongodb" | "dynamodb";
    service: string; // rds, aurora, cloud-sql, etc.
    instance: string; // db.t4g.micro, etc.
    storage: number; // GB
    multiAz: boolean;
  };
  cache?: {
    type: "redis" | "memcached";
    service: string;
    instance: string;
  };
}

// 스토리지 설정
export interface StorageConfig {
  static?: {
    service: string; // s3, gcs, etc.
    cdn?: string; // cloudfront, cloud-cdn, etc.
  };
  media?: {
    service: string;
    processing?: string; // mediaconvert, etc.
  };
}

// 네트워킹 설정
export interface NetworkingConfig {
  loadBalancer: string; // alb, nlb, cloud-lb, etc.
  dns: string; // route53, cloud-dns, etc.
  ssl: string; // acm, etc.
  cdn?: string;
}

// 개발 가이드
export interface DevGuide {
  language: string;
  framework: string;
  orm: string;
  structure: string[];
  envVars: string[];
  patterns: string[];
  constraints: string[];
}

// 아키텍처 설계 결과
export interface ArchitectureDesign {
  meta: {
    serviceName: string;
    platform: Platform;
    region: string;
    estimatedCost: string;
    generatedAt: string;
  };
  compute: ComputeConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
  networking: NetworkingConfig;
  devGuide: DevGuide;
  scalingStrategy: string[];
  designDecisions: Array<{
    decision: string;
    reason: string;
  }>;
}

// 비용 추정
export interface CostEstimate {
  compute: number;
  database: number;
  cache: number;
  storage: number;
  networking: number;
  other: number;
  total: number;
  currency: "USD";
}
