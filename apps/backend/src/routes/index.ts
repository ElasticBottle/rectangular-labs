import { Hono } from "hono";
import { handle, streamHandle } from "hono/aws-lambda";
import { contextStorage } from "hono/context-storage";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { dbContext } from "../lib/hono";
import { authRouter } from "./api/auth/[...route]";
import { chatRouter } from "./api/chat/route";

const app = new Hono()
  .use(logger())
  .use(contextStorage())
  .use(dbContext)
  .route("/", authRouter)
  .route("/", chatRouter);

showRoutes(app, {
  verbose: true,
});

export const handler: unknown = process.env.SST_LIVE
  ? handle(app)
  : streamHandle(app);

export type AppType = typeof app;
