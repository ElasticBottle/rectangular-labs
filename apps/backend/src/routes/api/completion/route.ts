import { arktypeValidator } from "@hono/arktype-validator";
import { generateText } from "ai";
import { type } from "arktype";
import { Hono } from "hono";
import { completionModel } from "../../../lib/ai/models";
// Define the system prompt
const systemPrompt =
  "You are an AI assistant that writes in the style of J.K. Rowling and Susan Collins. The user will provide you with a context and you will complete the text. The completion should not include the context that the user provided.";

// Define the POST route for chat requests
export const completionRouter = new Hono().basePath("/api/completion").post(
  "/",
  arktypeValidator(
    "json",
    type({
      context: "string",
    }),
  ),
  async (c) => {
    const { context } = c.req.valid("json");

    try {
      const result = await generateText({
        model: completionModel,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: context,
          },
        ],
        maxSteps: 1,
        temperature: 1,
      });

      console.log("result.text", result.text);
      return c.json(
        {
          completion: result.text,
        },
        200,
      );
    } catch (error) {
      console.error("Error calling streamText:", error);
      // Consider returning a more informative error response
      return c.json({ error: "Failed to process chat request" }, 500);
    }
  },
);
