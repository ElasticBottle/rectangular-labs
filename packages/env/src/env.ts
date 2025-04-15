import { type } from "arktype";

const clientSchema = {
  VITE_APP_URL: "string",
} as const;

const ClientEnv = type(clientSchema);

export const parseClientEnv = (env: unknown) => {
  const result = ClientEnv(env);
  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }
  return result;
};
export type ClientEnv = typeof ClientEnv.infer;

const ServerEnv = type({
  "...": clientSchema,
  // delete all non-symbolic keys other than "onlyPreservedStringKey"
  "+": "delete",
  "[symbol]": "unknown",
  DATABASE_URL: "string>1",
  GOOGLE_GENERATIVE_AI_API_KEY: "string>1",
});
export const parseServerEnv = (env: unknown) => {
  const result = ServerEnv(env);
  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }
  return result;
};

export type ServerEnv = typeof ServerEnv.infer;
