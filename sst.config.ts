/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "rectangular-labs",

      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile:
            input.stage === "production"
              ? "rectangular-production"
              : "rectangular-dev",
        },
      },
    };
  },
  async run() {
    const { parseServerEnv } = await import("@rectangular-labs/env");
    const { Buffer } = await import("node:buffer");

    if (!process.env.CLOUDFLARE_ZONE_ID) {
      throw new Error("CLOUDFLARE_ZONE_ID is not set");
    }
    const dns = sst.cloudflare.dns({
      zone: process.env.CLOUDFLARE_ZONE_ID,
    });

    const isPermanentStage = ["production", "development"].includes($app.stage);
    const domain = (() => {
      if ($app.stage === "production") {
        return "scalenelab.com";
      }
      if ($app.stage === "development") {
        return "dev.scalenelab.com";
      }
      return `${$app.stage}.dev.scalenelab.com`;
    })();
    const frontendDomain = domain;
    const backendDomain = `${domain}/api`;
    const authDomain = isPermanentStage
      ? `auth.${domain}`
      : "auth.dev.scalenelab.com";

    const serverEnv = parseServerEnv({
      ...process.env,
      VITE_BACKEND_URL:
        process.env.VITE_BACKEND_URL ?? `https://${frontendDomain}`, //this really is just the hostname
      VITE_APP_URL: process.env.VITE_APP_URL ?? `https://${frontendDomain}`,
      VITE_AUTH_URL: process.env.VITE_AUTH_URL ?? `https://${authDomain}`,
    });
    const serverEnvString = Object.entries(serverEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");

    const basicAuth = $resolve([
      process.env.BASIC_AUTH_USERNAME,
      process.env.BASIC_AUTH_PASSWORD,
    ]).apply(([username, password]) =>
      Buffer.from(`${username}:${password}`).toString("base64"),
    );
    const router = isPermanentStage
      ? new sst.aws.Router("AppRouter", {
          domain: {
            name: domain,
            aliases: [`*.${domain}`],
            dns,
          },
          edge: {
            viewerRequest: {
              injection: $interpolate`
            if (
                !event.request.headers.authorization
                  || event.request.headers.authorization.value !== "Basic ${basicAuth}"
               ) {
              return {
                statusCode: 401,
                headers: {
                  "www-authenticate": { value: "Basic" }
                }
              };
            }`,
            },
          },
        })
      : sst.aws.Router.get("AppRouter", "E3BTU6T4OWUEPF");

    const api = new sst.aws.Function("Hono", {
      handler: "apps/backend/src/routes/index.handler",
      environment: serverEnv,
      url: true,
      streaming: !$dev,
      timeout: "120 seconds",
    });
    router.route(backendDomain, api.url, {
      readTimeout: "30 seconds",
      keepAliveTimeout: "30 seconds",
    });

    new sst.aws.StaticSite("WWW", {
      path: "apps/www",
      build: {
        command:
          $app.stage === "production"
            ? `${serverEnvString} pnpm build:prod`
            : `${serverEnvString} pnpm build:dev`,
        output: "dist",
      },
      dev: {
        command: "pnpm dev",
      },
      route: { router, domain: frontendDomain },
    });

    const { authDynamoTable, authIssuer: _ } = (() => {
      if (isPermanentStage) {
        const authDynamoTable = new sst.aws.Dynamo("OpenAuthStorage", {
          fields: { pk: "string", sk: "string" },
          primaryIndex: { hashKey: "pk", rangeKey: "sk" },
          ttl: "expiry",
        });

        const authIssuer = new sst.aws.Function("OpenAuthIssuer", {
          handler: "packages/auth/src/index.handler",
          link: [authDynamoTable],
          environment: {
            ...serverEnv,
            OPENAUTH_STORAGE: $jsonStringify({
              type: "dynamo",
              options: { table: authDynamoTable.name },
            }),
          },
          url: {
            router: {
              instance: router,
              domain: authDomain,
            },
            cors: false,
          },
        });
        return { authIssuer, authDynamoTable };
      }
      return { authIssuer: null, authDynamoTable: null };
    })();

    new sst.x.DevCommand("Packages", {
      dev: {
        autostart: true,
        command: "pnpm dev:packages",
      },
    });

    return {
      router: router.distributionID,
      authTable: authDynamoTable?.name,
    };
  },
});
