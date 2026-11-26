# Using tok_mcp in a starter CLI

[한국어](README.md)

The generator passes framework, language, ORM and entrypoints through the public starter input. The generated app does not acquire a runtime dependency. Build this checkout with `npm ci` in the repository root before installing this example, which resolves tok_mcp through `file:../..`.

## Create a T3 project and its architecture documents

```sh
npm install
node t3/create.mjs team-board 500 150
```

Use a new directory name. The last two arguments are daily active users and monthly budget in USD. The wrapper runs the official T3 generator with Prisma, PostgreSQL and tRPC, then writes Markdown and YAML under `team-board/tok-architecture/`. See the [generated Markdown](sample/ARCHITECTURE.md) and [YAML](sample/.ai-context.yaml).

## Add the step to another CLI

After scaffolding succeeds, call `renderStarterDocs(starter, projectDirectory, scenario)` from [integration.mjs](integration.mjs). It returns a filename-to-content object. The caller owns file writes. The [example command](run.mjs) creates a new output directory and refuses to overwrite an earlier run.

| Starter | Profile | Tested template |
|---|---|---|
| create-t3-app 7.40.0 | t3 | Next.js Pages Router, Prisma PostgreSQL and tRPC |
| @nestjs/cli 12.0.15 | nest | TypeScript and the Express HTTP adapter |
| create-fastify 5.0.0 | fastify | JavaScript app with autoloaded plugins and routes |
| express-generator 4.16.1 | express | JavaScript app with no view engine |
| create-next-app 16.4.6 | next | TypeScript App Router, static hosting scenario |

[Commands for all five generators](README.md) · [Candidate ranking and product gaps, in Korean](ADOPTION.md)

After running the five commands, run `node verify.mjs .`. With 500 DAU and a $150 budget, the T3 PostgreSQL plan estimates $72.65/month. Nest leaves the database undecided, Fastify runs without a database ($34.26), Express leaves hosting undecided, and Next models static files on AWS ($1.25). Undecided plans have no total. The verifier checks both documents. The scenarios describe proposed infrastructure and do not deploy the apps or configure Next.js static export.
