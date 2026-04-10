import { describe, it, expect, vi, beforeEach } from "vitest";
import { interpretLetter } from "@/lib/ai/interpret-letter";

vi.mock("@anthropic-ai/sdk", () => {
  const mockResponse = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          world: {
            terrain: { type: "ocean", variation: "calm twilight sea", scale: 0.7 },
            atmosphere: {
              time_of_day: "dusk",
              weather: "fog",
              fog_density: 0.5,
              wind_strength: 0.2,
            },
            palette: {
              primary: "#1a1a2e",
              secondary: "#4a4e69",
              accent: "#c9ada7",
              ambient_light: "#2a2a4a",
              directional_light: "#ffd6a5",
            },
            particles: { type: "fireflies", density: 0.3, speed: 0.2 },
            objects: [
              {
                type: "water_body",
                subtype: "calm ocean",
                position_hint: "center",
                scale: 0.9,
              },
            ],
            mood: {
              primary_emotion: "bittersweet longing",
              intensity: 0.7,
              description: "A quiet twilight world where waves whisper memories",
            },
          },
          world_model: {
            enabled: true,
            progression: "ease-in-out",
            dynamics: {
              fog_density: { from: 0.2, to: 0.6 },
              wind_strength: { from: 0.1, to: 0.3 },
              particle_density: { from: 0.25, to: 0.45 },
              particle_speed: { from: 0.15, to: 0.4 },
              mood_intensity: { from: 0.5, to: 0.85 },
            },
            narrative_arc: ["opening hush", "rising memory", "quiet release"],
          },
          skybox_prompt:
            "360 equirectangular panorama, twilight ocean, purple gold sky, soft fog, ethereal",
          camera_timeline: [
            {
              timestamp_pct: 0.0,
              position: { x: 0, y: 5, z: 20 },
              look_at: { x: 0, y: 2, z: 0 },
              transition: "smooth",
              description: "Opening vista",
            },
            {
              timestamp_pct: 1.0,
              position: { x: 0, y: 3, z: 5 },
              look_at: { x: 0, y: 1, z: -5 },
              transition: "smooth",
              description: "Closing intimacy",
            },
          ],
        }),
      },
    ],
  };

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue(mockResponse),
      },
    })),
  };
});

describe("interpretLetter", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test-key-for-unit-tests");
    vi.stubEnv("OLLAMA_MODEL", "");
    vi.stubEnv("OLLAMA_BASE_URL", "");
  });

  it("converts a letter into a valid WorldConfig", async () => {
    const result = await interpretLetter({
      letter: "따뜻하면서도 쓸쓸한, 황혼의 바다 위에 서 있는 느낌",
      songTitle: "Sunset",
      artist: "Dream Artist",
      worldModelMode: "dynamic",
    });

    expect(result.world.terrain.type).toBe("ocean");
    expect(result.world.mood.primary_emotion).toBe("bittersweet longing");
    expect(result.world_model?.enabled).toBe(true);
    expect(result.skybox_prompt).toContain("equirectangular");
    expect(result.camera_timeline.length).toBeGreaterThanOrEqual(2);
    expect(result.camera_timeline[0].timestamp_pct).toBe(0.0);
    expect(result.camera_timeline.at(-1)!.timestamp_pct).toBe(1.0);
  });

  it("supports classic mode by not requiring world_model", async () => {
    const result = await interpretLetter({
      letter: "조용하고 잔잔한 밤의 호수",
      songTitle: "Still Night",
      artist: "Dream Artist",
      worldModelMode: "classic",
    });

    expect(result.world.terrain.type).toBe("ocean");
    expect(Object.hasOwn(result, "world_model")).toBe(true);
    expect(result.world_model).toBeUndefined();
  });

  it("deterministically strengthens weak dynamics in generative mode", async () => {
    const result = await interpretLetter({
      letter: "희미한 안개와 아주 작은 떨림만 있는 세계",
      songTitle: "Weak Signal",
      artist: "Dream Artist",
      worldModelMode: "generative",
    });

    expect(result.world_model?.enabled).toBe(true);
    expect(result.world_model?.progression).toBe("ease-in-out");

    const dynamics = result.world_model?.dynamics;
    expect(dynamics?.fog_density).toBeDefined();
    expect(dynamics?.fog_density!.to - dynamics?.fog_density!.from).toBeGreaterThanOrEqual(0.35);
    expect(dynamics?.particle_speed!.to - dynamics?.particle_speed!.from).toBeGreaterThanOrEqual(0.35);
    expect(dynamics?.mood_intensity!.to).toBeGreaterThanOrEqual(0.7);
  });
});
