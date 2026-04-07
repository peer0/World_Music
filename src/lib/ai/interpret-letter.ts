import Anthropic from "@anthropic-ai/sdk";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";
import { LETTER_INTERPRETATION_PROMPT } from "./prompts";

interface LetterInput {
  letter: string;
  songTitle: string;
  artist: string;
}

const OLLAMA_BASE = "http://localhost:11434";
const OLLAMA_MODEL = "gemma4:e4b";

async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function interpretWithOllama(input: LetterInput): Promise<WorldConfig> {
  const userMessage = `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}`;

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: LETTER_INTERPRETATION_PROMPT },
        { role: "user", content: userMessage },
      ],
      stream: false,
      options: { temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.message?.content;
  if (!text) {
    throw new Error("Empty response from Ollama");
  }

  // Extract JSON from response (model might wrap it in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Ollama response");
  }

  return parseWorldConfig(jsonMatch[0]);
}

function generateMockWorldConfig(input: LetterInput): WorldConfig {
  return {
    world: {
      terrain: { type: "plains", variation: "gentle rolling hills", scale: 0.6 },
      atmosphere: { time_of_day: "dusk", weather: "fog", fog_density: 0.4, wind_strength: 0.2 },
      palette: {
        primary: "#1a1a2e", secondary: "#4a4e69", accent: "#c9ada7",
        ambient_light: "#2a2a4a", directional_light: "#ffd6a5",
      },
      particles: { type: "fireflies", density: 0.4, speed: 0.3 },
      objects: [
        { type: "light_source", subtype: "gentle glow", position_hint: "scattered", scale: 0.5 },
        { type: "tree", subtype: "quiet presence", position_hint: "center", scale: 0.7 },
      ],
      mood: {
        primary_emotion: "quiet wonder",
        intensity: 0.6,
        description: `"${input.songTitle}" by ${input.artist} — fallback world (Ollama not available)`,
      },
    },
    scene_image: {
      scene_description: `A dreamlike twilight landscape for "${input.songTitle}" by ${input.artist}. Gentle fog drifts over rolling hills under a gradient sky shifting from deep purple to warm amber.`,
      style: "dreamlike",
      panorama_prompt: "360 degree equirectangular panorama photograph, dreamlike twilight landscape, gentle fog drifting over rolling hills, gradient sky from deep purple to warm amber, scattered fireflies glowing softly, silhouettes of ancient trees on the horizon, ethereal and peaceful atmosphere, cinematic lighting",
      depth_layers: ["distant purple mountains and gradient sky", "rolling hills with scattered trees", "misty foreground with glowing fireflies"],
    },
    skybox_prompt: "360 equirectangular panorama, dusk sky, fog, ethereal atmosphere",
    camera_timeline: [
      { timestamp_pct: 0.0, position: { x: 0, y: 8, z: 25 }, look_at: { x: 0, y: 2, z: 0 }, transition: "smooth", description: "Opening" },
      { timestamp_pct: 0.3, position: { x: -8, y: 5, z: 15 }, look_at: { x: 0, y: 1, z: 0 }, transition: "smooth", description: "Approaching" },
      { timestamp_pct: 0.6, position: { x: 0, y: 3, z: 5 }, look_at: { x: 3, y: 2, z: -5 }, transition: "smooth", description: "Immersion" },
      { timestamp_pct: 1.0, position: { x: 5, y: 4, z: -3 }, look_at: { x: 0, y: 2, z: 5 }, transition: "smooth", description: "Closing" },
    ],
  };
}

export async function interpretLetter(input: LetterInput): Promise<WorldConfig> {
  // Priority 1: Claude API (if real key exists)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.startsWith("sk-ant-")) {
    console.log("Using Claude API for letter interpretation");
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: LETTER_INTERPRETATION_PROMPT,
      messages: [
        { role: "user", content: `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}` },
      ],
    });
    const text = response.content[0];
    if (text.type !== "text") throw new Error("Unexpected response type from Claude");
    return parseWorldConfig(text.text);
  }

  // Priority 2: Ollama (local LLM)
  if (await isOllamaRunning()) {
    console.log("Using Ollama (local LLM) for letter interpretation");
    try {
      return await interpretWithOllama(input);
    } catch (err) {
      console.error("Ollama interpretation failed, falling back to mock:", err);
    }
  }

  // Priority 3: Mock fallback
  console.log("No AI available — using mock world generation");
  return generateMockWorldConfig(input);
}
