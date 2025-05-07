import { google } from "@ai-sdk/google";

// Define specific models. The SDK automatically uses the environment variable
// GOOGLE_GENERATIVE_AI_API_KEY if provided.

// Model for the main chat agent with multimodal and grounding capabilities
export const mainAgentModel = google("gemini-2.5-pro-preview-03-25");

// Model for NICE classification (structured output, potentially flash for cost/speed)
export const niceClassificationModel = google("gemini-2.5-pro-preview-03-25");

// Model for Goods & Services recommendations (structured output)
export const goodsServicesModel = google("gemini-2.5-pro-preview-03-25");

export const completionModel = google("gemini-2.0-flash-001");
