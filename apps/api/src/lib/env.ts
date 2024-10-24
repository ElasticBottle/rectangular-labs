import { Schema } from "@effect/schema";

const EnvSchema = Schema.Struct({
  DISCORD_CLIENT_ID: Schema.String.pipe(Schema.nonEmptyString()),
  DISCORD_CLIENT_SECRET: Schema.String.pipe(Schema.nonEmptyString()),
  GITHUB_CLIENT_ID: Schema.String.pipe(Schema.nonEmptyString()),
  GITHUB_CLIENT_SECRET: Schema.String.pipe(Schema.nonEmptyString()),
  TURSO_DATABASE_URL: Schema.String.pipe(Schema.nonEmptyString()),
  TURSO_AUTH_TOKEN: Schema.String.pipe(Schema.nonEmptyString()),
  BASE_URL: Schema.Any,
  OTEL_SECRET_KEY: Schema.String.pipe(Schema.nonEmptyString()),
  OTEL_URL: Schema.String.pipe(Schema.nonEmptyString()),
  OTEL_SERVICE_NAME: Schema.String.pipe(Schema.nonEmptyString()),
});

export interface Env extends Schema.Schema.Type<typeof EnvSchema> {}

export const decodeApiEnvFromUnknownSync = Schema.decodeUnknownSync(EnvSchema);
