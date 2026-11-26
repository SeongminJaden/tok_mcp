# 서울 리전 단가 / Seoul list prices

확인일 2026-11-26. 표시 금액은 USD입니다. 월 730시간 동안 최소 인스턴스 수를 유지한다고 가정합니다. 할인·무료 티어·세금은 적용하지 않습니다. 네트워크는 로드밸런서 기본료만 포함합니다. 전송량, 요청 수, LCU, 백업, 공인 IP, DNS, 로그는 별도입니다.

Checked on 26 November 2026. Amounts are in USD and assume 730 hours at the minimum instance count. Discounts, free tiers and tax are excluded. The networking line covers the load balancer base fee. Data transfer, requests, capacity units, backups, public IPs, DNS and logs depend on usage and are outside the estimate.

| Component | Seoul list price | Source |
|---|---:|---|
| Fargate Linux ARM | $0.03725/vCPU-hour + $0.00409/GB-hour | [Amazon ECS offer](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonECS/current/ap-northeast-2/index.csv) |
| Fargate Linux x86 | $0.04656/vCPU-hour + $0.00511/GB-hour | [Amazon ECS offer](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonECS/current/ap-northeast-2/index.csv) |
| RDS PostgreSQL, Single-AZ | db.t4g.small $0.051/hour + gp3 $0.131/GB-month | [Amazon RDS offer](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/ap-northeast-2/index.csv) |
| ElastiCache Redis OSS | cache.t4g.micro $0.024/node-hour | [ElastiCache offer](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonElastiCache/current/ap-northeast-2/index.csv) |
| S3 Standard | $0.025/GB-month, first 50 TB | [Amazon S3 offer](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/ap-northeast-2/index.csv) |
| ALB or NLB | $0.0225/hour | [Elastic Load Balancing offer](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSELB/current/ap-northeast-2/index.csv) |
| Cloud Run, instance-based | $0.0000216/vCPU-second + $0.0000024/GiB-second | [Cloud Run](https://cloud.google.com/run/pricing) |
| Cloud SQL PostgreSQL, zonal | db-f1-micro $0.0137/hour or db-g1-small $0.0455/hour + SSD $0.221/GiB-month | [Cloud SQL](https://cloud.google.com/sql/pricing) |
| Cloud Storage Standard | $0.023/GiB-month | [Cloud Storage](https://cloud.google.com/storage/pricing) |
| Cloud Load Balancing | $0.025/hour for the first group of forwarding rules | [Load Balancing](https://cloud.google.com/load-balancing/pricing) |

AWS 리전은 `ap-northeast-2`, GCP 리전은 `asia-northeast3`입니다. 객체 저장소의 기본 사용량은 50GB(AWS) 또는 50GiB(GCP)입니다. 각 항목을 센트 단위로 반올림한 뒤 합산합니다. 지원되지 않는 구성을 입력하면 금액을 비워 둡니다. Naver Cloud는 서버 세대와 사양을 지정해 공식 계산기에서 원화로 확인하세요. [Naver Cloud 요금](https://www.ncloud.com/charge/price/ko)

The model covers AWS Seoul and Google Cloud Seoul. Object storage assumes 50 GB on AWS or 50 GiB on Google Cloud. Each line is rounded to cents before addition. An unpriced component leaves the estimate unavailable. For Naver Cloud, select the server generation and size in the provider’s KRW calculator. [Naver Cloud pricing](https://www.ncloud.com/charge/price/ko)

0.3.0에서 DB 없음은 DB·캐시 비용 0, 미정은 총액 보류로 처리합니다. 정적 호스팅은 서울 객체 저장소 50GB(AWS $1.25) 또는 50GiB(GCP $1.15)만 포함합니다. 요청·CDN·전송 요금은 별도입니다.

In 0.3.0, an absent database contributes zero database and cache charges. An undecided database leaves the total unavailable. Static hosting includes only 50 GB in Seoul S3 ($1.25) or 50 GiB in Seoul Cloud Storage ($1.15). Requests, CDN and transfer are extra.
