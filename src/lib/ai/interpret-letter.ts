import Anthropic from "@anthropic-ai/sdk";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";
import { LETTER_INTERPRETATION_PROMPT } from "./prompts";

interface LetterInput {
  letter: string;
  songTitle: string;
  artist: string;
}

function generateMockWorldConfig(input: LetterInput): WorldConfig {
  // Derive a simple "mood" from the letter length and content
  const letterLower = input.letter.toLowerCase();
  const hasWarm = /따뜻|warm|희망|빛|light|sun/i.test(letterLower);
  const hasSad = /슬프|쓸쓸|lonely|sad|비|rain|눈물/i.test(letterLower);
  const hasNight = /밤|night|별|star|달|moon|어둠|dark/i.test(letterLower);

  const terrain = hasNight ? "void" as const
    : hasSad ? "ocean" as const
    : hasWarm ? "plains" as const
    : "forest" as const;

  const weather = hasSad ? "rain" as const
    : hasNight ? "clear" as const
    : "fog" as const;

  const particles = hasSad ? "rain" as const
    : hasNight ? "stars" as const
    : hasWarm ? "fireflies" as const
    : "petals" as const;

  const time = hasNight ? "night" as const
    : hasSad ? "dusk" as const
    : hasWarm ? "dawn" as const
    : "dusk" as const;

  return {
    world: {
      terrain: { type: terrain, variation: `a gentle ${terrain} shaped by feeling`, scale: 0.6 },
      atmosphere: { time_of_day: time, weather, fog_density: 0.4, wind_strength: 0.2 },
      palette: {
        primary: hasSad ? "#1a1a2e" : hasWarm ? "#2d4059" : "#1a2a1a",
        secondary: hasSad ? "#4a4e69" : hasWarm ? "#ea8c55" : "#4a6741",
        accent: hasSad ? "#c9ada7" : hasWarm ? "#ffd6a5" : "#a7c4a0",
        ambient_light: hasNight ? "#111133" : "#2a2a4a",
        directional_light: hasWarm ? "#ffd6a5" : "#aabbcc",
      },
      particles: { type: particles, density: 0.4, speed: 0.3 },
      objects: [
        { type: "light_source" as const, subtype: "gentle glow", position_hint: "scattered" as const, scale: 0.5 },
        { type: terrain === "ocean" ? "water_body" as const : "tree" as const, subtype: "quiet presence", position_hint: "center" as const, scale: 0.7 },
      ],
      mood: {
        primary_emotion: hasSad ? "bittersweet longing" : hasWarm ? "gentle warmth" : "quiet wonder",
        intensity: 0.6,
        description: `A world born from a letter about "${input.songTitle}" by ${input.artist} (mock mode)`,
      },
    },
    skybox_prompt: `360 equirectangular panorama, ${time} sky, ${weather}, ethereal atmosphere, ${terrain} horizon`,
    camera_timeline: [
      { timestamp_pct: 0.0, position: { x: 0, y: 8, z: 25 }, look_at: { x: 0, y: 2, z: 0 }, transition: "smooth" as const, description: "Opening — distant view" },
      { timestamp_pct: 0.3, position: { x: -8, y: 5, z: 15 }, look_at: { x: 0, y: 1, z: 0 }, transition: "smooth" as const, description: "Approaching — entering the world" },
      { timestamp_pct: 0.6, position: { x: 0, y: 3, z: 5 }, look_at: { x: 3, y: 2, z: -5 }, transition: "smooth" as const, description: "Immersion — inside the world" },
      { timestamp_pct: 1.0, position: { x: 5, y: 4, z: -3 }, look_at: { x: 0, y: 2, z: 5 }, transition: "smooth" as const, description: "Closing — looking back" },
    ],
  };
}

export async function interpretLetter(input: LetterInput): Promise<WorldConfig> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    console.log("No ANTHROPIC_API_KEY set — using mock world generation");
    return generateMockWorldConfig(input);
  }

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
