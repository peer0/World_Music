import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";
import { strengthenRange } from "@/lib/world-model/strengthen-dynamics";
import { LETTER_INTERPRETATION_PROMPT } from "./prompts";

interface LetterInput {
  letter: string;
  songTitle: string;
  artist: string;
  worldModelMode?: "classic" | "dynamic" | "generative";
}

function applyWorldModelMode(
  config: WorldConfig,
  mode: LetterInput["worldModelMode"]
): WorldConfig {
  if (mode === "classic") {
    const withoutWorldModel: WorldConfig = {
      ...config,
      world_model: undefined,
    };
    return withoutWorldModel;
  }

  if (mode === "generative") {
    const source = config.world_model?.dynamics;

    return {
      ...config,
      world_model: {
        enabled: true,
        progression: "ease-in-out",
        dynamics: {
          fog_density: strengthenRange(source?.fog_density, { from: 0.15, to: 0.75 }, { minSpread: 0.35, floor: 0.05, ceil: 0.95 }),
          wind_strength: strengthenRange(source?.wind_strength, { from: 0.05, to: 0.6 }, { minSpread: 0.3, floor: 0.0, ceil: 0.9 }),
          particle_density: strengthenRange(source?.particle_density, { from: 0.2, to: 0.8 }, { minSpread: 0.35, floor: 0.05, ceil: 0.95 }),
          particle_speed: strengthenRange(source?.particle_speed, { from: 0.1, to: 0.7 }, { minSpread: 0.35, floor: 0.0, ceil: 0.95 }),
          mood_intensity: strengthenRange(source?.mood_intensity, { from: 0.4, to: 1.0 }, { minSpread: 0.35, floor: 0.2, ceil: 1.0 }),
        },
        narrative_arc: config.world_model?.narrative_arc ?? [
          "quiet opening",
          "transformative swell",
          "mythic afterglow",
        ],
      },
    };
  }

  return config;
}

async function interpretWithGemini(input: LetterInput): Promise<WorldConfig> {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });

  const modeInstruction = input.worldModelMode
    ? `\n\nWorld model mode: ${input.worldModelMode}. If mode is classic, omit world_model. If dynamic or generative, include world_model with stronger dynamics for generative.`
    : "";

  const userMessage = `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}${modeInstruction}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction: LETTER_INTERPRETATION_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");

    const parsed = parseWorldConfig(jsonMatch[0]);
    return applyWorldModelMode(parsed, input.worldModelMode);
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
    world_model: {
      enabled: true,
      progression: "ease-in-out",
      dynamics: {
        fog_density: { from: 0.25, to: 0.55 },
        wind_strength: { from: 0.1, to: 0.35 },
        particle_density: { from: 0.2, to: 0.45 },
        particle_speed: { from: 0.15, to: 0.35 },
        mood_intensity: { from: 0.45, to: 0.75 },
      },
      narrative_arc: [
        "quiet opening breath",
        "deepening emotional immersion",
        "lingering afterglow",
      ],
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
  // Priority 1: Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.startsWith("sk-ant-")) {
    console.log("Using Claude API for letter interpretation");
    const client = new Anthropic();
    const modeInstruction = input.worldModelMode
      ? `\n\nWorld model mode: ${input.worldModelMode}. If mode is classic, omit world_model. If dynamic or generative, include world_model with stronger dynamics for generative.`
      : "";
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: LETTER_INTERPRETATION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}${modeInstruction}`,
        },
      ],
    });
    const text = response.content[0];
    if (text.type !== "text") throw new Error("Unexpected response type from Claude");
    const parsed = parseWorldConfig(text.text);
    return applyWorldModelMode(parsed, input.worldModelMode);
  }

  // Priority 2: Gemini via Vertex AI (GCP free credits)
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    console.log("Using Gemini (Vertex AI) for letter interpretation");
    try {
      return await interpretWithGemini(input);
    } catch (err) {
      console.error("Gemini interpretation failed:", err);
    }
  }

  // Priority 3: Mock fallback
  console.log("No AI available — using mock world generation");
  const mock = generateMockWorldConfig(input);
  return applyWorldModelMode(mock, input.worldModelMode);
}
