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
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("converts a letter into a valid WorldConfig", async () => {
    const result = await interpretLetter({
      letter: "따뜻하면서도 쓸쓸한, 황혼의 바다 위에 서 있는 느낌",
      songTitle: "Sunset",
      artist: "Dream Artist",
    });

    expect(result.world.terrain.type).toBe("ocean");
    expect(result.world.mood.primary_emotion).toBe("bittersweet longing");
    expect(result.skybox_prompt).toContain("equirectangular");
    expect(result.camera_timeline.length).toBeGreaterThanOrEqual(2);
    expect(result.camera_timeline[0].timestamp_pct).toBe(0.0);
    expect(result.camera_timeline.at(-1)!.timestamp_pct).toBe(1.0);
  });
});
