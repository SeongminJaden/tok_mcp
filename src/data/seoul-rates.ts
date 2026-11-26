// AWS Seoul on-demand USD rates. See PRICING.md for units and sources.
export const aws = {
  "arm64": {
    "cpu": 0.03725,
    "memory": 0.00409
  },
  "x86_64": {
    "cpu": 0.04656,
    "memory": 0.00511
  },
  "postgres": {
    "db.r6g.12xlarge": 6.474,
    "db.r6g.16xlarge": 8.632,
    "db.r6g.2xlarge": 1.079,
    "db.r6g.4xlarge": 2.158,
    "db.r6g.8xlarge": 4.316,
    "db.r6g.large": 0.27,
    "db.r6g.xlarge": 0.54,
    "db.t3.2xlarge": 0.896,
    "db.t3.large": 0.224,
    "db.t3.medium": 0.112,
    "db.t3.micro": 0.028,
    "db.t3.small": 0.056,
    "db.t3.xlarge": 0.448,
    "db.t4g.2xlarge": 0.813,
    "db.t4g.large": 0.203,
    "db.t4g.medium": 0.102,
    "db.t4g.micro": 0.025,
    "db.t4g.small": 0.051,
    "db.t4g.xlarge": 0.406
  },
  "gp3": 0.131,
  "redis": {
    "cache.r6g.12xlarge": 5.897,
    "cache.r6g.16xlarge": 7.862,
    "cache.r6g.2xlarge": 0.983,
    "cache.r6g.4xlarge": 1.966,
    "cache.r6g.8xlarge": 3.931,
    "cache.r6g.large": 0.246,
    "cache.r6g.xlarge": 0.491,
    "cache.t4g.medium": 0.094,
    "cache.t4g.micro": 0.024,
    "cache.t4g.small": 0.047
  },
  "loadBalancer": {
    "alb": 0.0225,
    "nlb": 0.0225
  },
  "s3": 0.025
};
