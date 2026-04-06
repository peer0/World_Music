import Anthropic from "@anthropic-ai/sdk";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";
import { LETTER_INTERPRETATION_PROMPT } from "./prompts";

interface LetterInput {
  letter: string;
  songTitle: string;
  artist: string;
}

export async function interpretLetter(input: LetterInput): Promise<WorldConfig> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: LETTER_INTERPRETATION_PROMPT,
    messages: [
      {
        role: "user",
        content: `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}`,
      },
    ],
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return parseWorldConfig(text.text);
}
