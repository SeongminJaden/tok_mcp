import type { ArchitectureDesign, ArchitecturePlan, CostEstimate, Platform } from "../types/index.js";
import { aws } from "./seoul-rates.js";

const hours = 730;
export const costAssumptions = "2026-11-26 서울 공개 단가(USD), 월 730시간, 구성된 객체 저장소 50GB, 로드밸런서 1개 기본료 기준. 트래픽·요청·LCU·공인 IP·백업·세금·할인은 제외합니다.";

type CostDesign = {
  meta?: { region: string };
  compute: Pick<ArchitectureDesign["compute"], "service" | "cpu" | "memory" | "minInstances"> & { cpuArch?: string };
  database: {
    primary: { type: string; instance: string; storage: number; multiAz?: boolean; service?: string };
    cache?: { instance: string; type: string };
  } | null;
  storage?: ArchitectureDesign["storage"];
  networking?: { loadBalancer: string };
};

function round(amount: number) {
  return Math.round(amount * 100) / 100;
}

function rate(table: Record<string, number>, key: string): number {
  return Object.hasOwn(table, key) ? table[key] : NaN;
}

function quantity(value: string, suffix: RegExp) {
  const match = suffix.exec(value);
  return match ? Number(match[1]) : NaN;
}

export function calculateCost(platform: Platform, design: CostDesign): CostEstimate | null {
  if (platform !== "aws" && platform !== "gcp") return null;
  const region = platform === "aws" ? "ap-northeast-2" : "asia-northeast3";
  if (design.meta && design.meta.region !== region) return null;

  const { compute, database } = design;
  const db = database?.primary;
  const cpu = quantity(compute.cpu, /^([\d.]+)(?:vCPU)?$/i);
  const ram = quantity(compute.memory, /^([\d.]+)(?:Gi?B)?$/i);
  if (!(cpu > 0 && ram > 0) || !Number.isSafeInteger(compute.minInstances) || compute.minInstances < 0 ||
      (db && (!Number.isFinite(db.storage) || db.storage < 0 || db.type !== "postgresql" || db.multiAz))) return null;

  let computeHourly, databaseHourly, cacheHourly = 0, diskMonthly, storageMonthly, lbHourly;
  if (platform === "aws") {
    if (!["ecs-fargate", "fargate"].includes(compute.service) || (db?.service && db.service !== "rds")) return null;
    const arch = compute.cpuArch ?? "x86_64";
    if (arch !== "arm64" && arch !== "x86_64") return null;
    computeHourly = cpu * aws[arch].cpu + ram * aws[arch].memory;
    databaseHourly = db ? rate(aws.postgres, db.instance) : 0;
    if (database?.cache) {
      if (database.cache.type !== "redis") return null;
      cacheHourly = rate(aws.redis, database.cache.instance);
    }
    diskMonthly = aws.gp3;
    storageMonthly = aws.s3;
    lbHourly = rate(aws.loadBalancer, design.networking?.loadBalancer ?? "alb");
  } else {
    if (compute.service !== "cloud-run" || cpu < 1 || database?.cache ||
        (compute.cpuArch && compute.cpuArch !== "x86_64") ||
        (db?.service && db.service !== "cloud-sql") ||
        (design.networking && design.networking.loadBalancer !== "cloud-lb")) return null;
    computeHourly = 3600 * (cpu * 0.0000216 + ram * 0.0000024);
    databaseHourly = db ? rate({ "db-f1-micro": 0.0137, "db-g1-small": 0.0455 }, db.instance) : 0;
    diskMonthly = 0.221;
    storageMonthly = 0.023;
    lbHourly = 0.025;
  }

  const items = {
    compute: round(computeHourly * hours * compute.minInstances),
    database: round(databaseHourly * hours + diskMonthly * (db?.storage ?? 0)),
    cache: round(cacheHourly * hours),
    storage: round((!design.storage || design.storage.static ? 50 : 0) * storageMonthly),
    networking: round(lbHourly * hours),
    other: 0,
  };
  if (!Object.values(items).every(Number.isFinite)) return null;
  return { ...items, total: round(Object.values(items).reduce((sum, amount) => sum + amount, 0)), currency: "USD" };
}

export function estimatePlanCost(plan: ArchitecturePlan): CostEstimate | null {
  const { platform, region } = plan.meta;
  const deployment = plan.deployment ?? { runtime: "server", database: "required" };
  if (platform === "undecided" || deployment.runtime === "undecided" || deployment.database === "undecided") return null;
  if (deployment.runtime === "static") {
    const storage = plan.storage.static?.service;
    const monthlyRate = platform === "aws" && region === "ap-northeast-2" && storage === "s3" ? aws.s3 :
      platform === "gcp" && region === "asia-northeast3" && storage === "gcs" ? 0.023 : null;
    if (monthlyRate === null || deployment.database !== "none") return null;
    const total = round(50 * monthlyRate);
    return { compute: 0, database: 0, cache: 0, storage: total, networking: 0, other: 0, total, currency: "USD" };
  }
  if (!plan.compute || !plan.networking || (deployment.database === "required" && !plan.database?.primary)) return null;
  return calculateCost(platform, {
    meta: plan.meta, compute: plan.compute, database: deployment.database === "none" ? null : plan.database,
    storage: plan.storage, networking: plan.networking,
  });
}
