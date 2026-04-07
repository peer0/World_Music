import Anthropic from "@anthropic-ai/sdk";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";
import { LETTER_INTERPRETATION_PROMPT } from "./prompts";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

interface LetterInput {
  letter: string;
  songTitle: string;
  artist: string;
}

async function interpretWithReplicate(input: LetterInput): Promise<WorldConfig> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) throw new Error("No REPLICATE_API_TOKEN");

  const userMessage = `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}`;

  // Use Replicate's serverless API with meta/llama model
  const res = await fetch(`${REPLICATE_API_BASE}/models/meta/meta-llama-3-8b-instruct/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt: userMessage,
        system_prompt: LETTER_INTERPRETATION_PROMPT,
        max_tokens: 4096,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Replicate LLM error: ${res.status} ${JSON.stringify(err)}`);
  }

  const prediction = await res.json();

  // Poll for completion
  let result = prediction;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`${REPLICATE_API_BASE}/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!pollRes.ok) throw new Error(`Replicate poll error: ${pollRes.status}`);
    result = await pollRes.json();
  }

  if (result.status === "failed") {
    throw new Error(`Replicate prediction failed: ${result.error || "unknown"}`);
  }

  // Output is an array of string tokens — join them
  const text = Array.isArray(result.output) ? result.output.join("") : result.output;
  if (!text) throw new Error("Empty response from Replicate LLM");

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Replicate LLM response");
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
        description: `"${input.songTitle}" by ${input.artist} — fallback world`,
      },
    },
    scene_image: {
      scene_description: `A dreamlike twilight landscape for "${input.songTitle}" by ${input.artist}.`,
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

  // Priority 2: Replicate LLM (remote, no local memory)
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (replicateToken) {
    console.log("Using Replicate LLM (remote) for letter interpretation");
    try {
      return await interpretWithReplicate(input);
    } catch (err) {
      console.error("Replicate LLM failed, falling back to mock:", err);
    }
  }

  // Priority 3: Mock fallback
  console.log("No AI available — using mock world generation");
  return generateMockWorldConfig(input);
}
