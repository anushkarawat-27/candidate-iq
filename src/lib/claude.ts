import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./constants";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const AI_AVAILABLE = !!apiKey;

const client = apiKey
  ? new Anthropic({ apiKey })
  : null;

export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 1024
): Promise<string> {
  if (!client) {
    throw new Error("AI features unavailable — no ANTHROPIC_API_KEY configured");
  }

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

export function parseJsonResponse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("Failed to parse Claude JSON response:", text.slice(0, 200));
    return null;
  }
}
