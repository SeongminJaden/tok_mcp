/**
 * 클라우드 비용 데이터
 * 2024년 기준 대략적인 가격 (실제 가격은 변동될 수 있음)
 */

import { Platform, ArchitectureDesign, CostEstimate } from "../types/index.js";

interface PricingData {
  compute: {
    fargateCpuHour: number;
    fargateMemHour: number;
    ec2Instances: Record<string, number>;
  };
  database: {
    rdsInstances: Record<string, number>;
    storagePerGB: number;
  };
  cache: {
    elasticacheInstances: Record<string, number>;
  };
  storage: {
    s3PerGB: number;
    dataTransferPerGB: number;
  };
  networking: {
    albHour: number;
    nlbHour: number;
  };
}

const awsPricing: PricingData = {
  compute: {
    fargateCpuHour: 0.04048, // per vCPU per hour
    fargateMemHour: 0.004445, // per GB per hour
    ec2Instances: {
      "t4g.micro": 6.1, // monthly
      "t4g.small": 12.2,
      "t4g.medium": 24.4,
      "t4g.large": 48.8,
      "t3.micro": 7.6,
      "t3.small": 15.2,
      "t3.medium": 30.4,
      "c7g.medium": 25,
      "c7g.large": 50,
      "m7g.medium": 30,
      "m7g.large": 60,
      "0.25vCPU": 15,
      "0.5vCPU": 25,
      "1vCPU": 45,
      "2vCPU": 85,
      "4vCPU": 165,
    },
  },
  database: {
    rdsInstances: {
      "db.t4g.micro": 12.5,
      "db.t4g.small": 25,
      "db.t4g.medium": 50,
      "db.t4g.large": 100,
      "db.t3.micro": 15,
      "db.t3.small": 30,
      "db.r6g.large": 150,
      "db.r6g.xlarge": 300,
    },
    storagePerGB: 0.115,
  },
  cache: {
    elasticacheInstances: {
      "cache.t4g.micro": 11,
      "cache.t4g.small": 22,
      "cache.t4g.medium": 45,
      "cache.r6g.large": 110,
      "cache.r6g.xlarge": 220,
    },
  },
  storage: {
    s3PerGB: 0.023,
    dataTransferPerGB: 0.09,
  },
  networking: {
    albHour: 0.0225,
    nlbHour: 0.0225,
  },
};

const gcpPricing: PricingData = {
  compute: {
    fargateCpuHour: 0.0526, // Cloud Run per vCPU per hour
    fargateMemHour: 0.0058, // Cloud Run per GB per hour
    ec2Instances: {
      "e2-micro": 6,
      "e2-small": 12,
      "e2-medium": 24,
      "t2a-standard-1": 20,
      "t2a-standard-2": 40,
      "n1-standard-1": 25,
      "n1-standard-2": 50,
      "0.25vCPU": 18,
      "0.5vCPU": 30,
      "1vCPU": 55,
      "2vCPU": 100,
      "4vCPU": 190,
    },
  },
  database: {
    rdsInstances: {
      "db-f1-micro": 8,
      "db-g1-small": 25,
      "db-n1-standard-1": 50,
      "db-n1-standard-2": 100,
    },
    storagePerGB: 0.17,
  },
  cache: {
    elasticacheInstances: {
      basic: 15,
      standard: 30,
      "standard-ha": 60,
    },
  },
  storage: {
    s3PerGB: 0.02,
    dataTransferPerGB: 0.12,
  },
  networking: {
    albHour: 0.025,
    nlbHour: 0.025,
  },
};

const naverCloudPricing: PricingData = {
  compute: {
    fargateCpuHour: 0.05,
    fargateMemHour: 0.006,
    ec2Instances: {
      "s-g2": 15,
      "m-g2": 30,
      "c-g2": 40,
      "s-g3": 20,
      "m-g3": 40,
      "0.25vCPU": 20,
      "0.5vCPU": 35,
      "1vCPU": 60,
      "2vCPU": 110,
      "4vCPU": 210,
    },
  },
  database: {
    rdsInstances: {
      "m2-g1": 20,
      "m2-g2": 40,
      "m2-g3": 80,
    },
    storagePerGB: 0.12,
  },
  cache: {
    elasticacheInstances: {
      "m2-g1": 15,
      "m2-g2": 30,
    },
  },
  storage: {
    s3PerGB: 0.025,
    dataTransferPerGB: 0.08,
  },
  networking: {
    albHour: 0.02,
    nlbHour: 0.02,
  },
};

export function getPricing(platform: Platform): PricingData {
  switch (platform) {
    case "aws":
      return awsPricing;
    case "gcp":
      return gcpPricing;
    case "naver-cloud":
      return naverCloudPricing;
    default:
      return awsPricing;
  }
}

export function calculateCost(
  platform: Platform,
  design: ArchitectureDesign
): CostEstimate {
  const pricing = getPricing(platform);

  // 컴퓨팅 비용
  let computeCost = 0;
  const cpuNum = parseFloat(design.compute.cpu) || 0.5;
  const memNum = parseFloat(design.compute.memory) || 1;
  const instances = design.compute.minInstances || 1;

  if (design.compute.service.includes("fargate") || design.compute.service.includes("cloud-run")) {
    // Fargate/Cloud Run: 시간당 과금
    const hoursPerMonth = 730;
    computeCost =
      (cpuNum * pricing.compute.fargateCpuHour +
        memNum * pricing.compute.fargateMemHour) *
      hoursPerMonth *
      instances;
  } else {
    // EC2/VM: 인스턴스 타입별 과금
    computeCost = pricing.compute.ec2Instances[design.compute.cpu] || 30;
    computeCost *= instances;
  }

  // 데이터베이스 비용
  const dbInstanceCost =
    pricing.database.rdsInstances[design.database.primary.instance] || 25;
  const dbStorageCost =
    design.database.primary.storage * pricing.database.storagePerGB;
  const databaseCost = dbInstanceCost + dbStorageCost;

  // 캐시 비용
  let cacheCost = 0;
  if (design.database.cache) {
    cacheCost =
      pricing.cache.elasticacheInstances[design.database.cache.instance] || 15;
  }

  // 스토리지 비용 (S3/GCS)
  const storageCost = 50 * pricing.storage.s3PerGB; // 50GB 가정

  // 네트워킹 비용
  const networkingCost =
    pricing.networking.albHour * 730 + // ALB
    100 * pricing.storage.dataTransferPerGB; // 100GB 데이터 전송 가정

  // 기타 비용 (모니터링, DNS 등)
  const otherCost = 5;

  const total = Math.round(
    computeCost + databaseCost + cacheCost + storageCost + networkingCost + otherCost
  );

  return {
    compute: Math.round(computeCost),
    database: Math.round(databaseCost),
    cache: Math.round(cacheCost),
    storage: Math.round(storageCost),
    networking: Math.round(networkingCost),
    other: otherCost,
    total,
    currency: "USD",
  };
}
