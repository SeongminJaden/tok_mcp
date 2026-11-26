import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { designArchitecture, generateArchitectureDocs } from "tok_mcp";

// Each entry describes one tested upstream template. Refuse other variants.
const templates = {
  t3: {
    packages: ["next", "@prisma/client", "@trpc/server"],
    paths: ["prisma/schema.prisma", "src/server/db.ts", "src/pages/index.tsx"],
    framework: "Next.js (Pages Router), tRPC", language: "typescript", orm: "Prisma",
  },
  nest: {
    packages: ["@nestjs/core", "@nestjs/platform-express"],
    paths: ["nest-cli.json", "src/main.ts", "src/app.module.ts"],
    framework: "NestJS (Express)", language: "typescript",
  },
  fastify: {
    packages: ["fastify", "@fastify/autoload"],
    paths: ["app.js", "plugins", "routes/root.js"],
    framework: "Fastify", language: "javascript",
  },
  express: {
    packages: ["express"], paths: ["app.js", "bin/www", "routes/index.js"],
    framework: "Express", language: "javascript",
  },
  next: {
    packages: ["next", "react"], paths: ["app/layout.tsx", "app/page.tsx", "next.config.ts"],
    framework: "Next.js (App Router)", language: "typescript",
  },
};

export async function renderStarterDocs(starter, projectDir, scenario) {
  if (!Object.hasOwn(templates, starter)) throw new Error("Choose t3, nest, fastify, express or next.");
  const template = templates[starter];
  const manifest = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8"));
  for (const name of template.packages) {
    if (!manifest.dependencies?.[name]) throw new Error(`Unsupported template: missing dependency ${name}`);
  }
  await Promise.all(template.paths.map(path => stat(join(projectDir, path))));
  if (starter === "t3") {
    const schema = await readFile(join(projectDir, "prisma/schema.prisma"), "utf8");
    const datasource = schema.match(/^\s*datasource\s+db\s*\{([^}]*)\}/m)?.[1];
    if (!/^\s*provider\s*=\s*"postgresql"\s*$/m.test(datasource ?? "")) {
      throw new Error("The T3 example requires the PostgreSQL datasource.");
    }
  }

  const design = designArchitecture({
    ...scenario,
    description: manifest.name,
    starter: {
      language: template.language, framework: template.framework,
      orm: template.orm ?? null, entrypoints: template.paths,
    },
  });
  if (starter === "t3" && design.database?.primary.type !== "postgresql") {
    throw new Error("The T3 sample requires a PostgreSQL deployment.");
  }
  return generateArchitectureDocs(design);
}
