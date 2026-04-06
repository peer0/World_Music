import { describe, it, expect } from "vitest";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";

describe("parseWorldConfig", () => {
  it("parses a valid WorldConfig JSON string", () => {
    const input: WorldConfig = {
      world: {
        terrain: { type: "ocean", variation: "calm deep sea", scale: 0.7 },
        atmosphere: {
          time_of_day: "dusk",
          weather: "fog",
          fog_density: 0.6,
          wind_strength: 0.3,
        },
        palette: {
          primary: "#1a1a2e",
          secondary: "#4a4e69",
          accent: "#c9ada7",
          ambient_light: "#2a2a4a",
          directional_light: "#ffd6a5",
        },
        particles: { type: "fireflies", density: 0.4, speed: 0.2 },
        objects: [
          {
            type: "water_body",
            subtype: "still lake",
            position_hint: "center",
            scale: 0.8,
          },
        ],
        mood: {
          primary_emotion: "melancholic warmth",
          intensity: 0.6,
          description: "A quiet dusk over a still ocean, glowing softly",
        },
      },
      skybox_prompt:
        "panoramic 360 equirectangular, dusky ocean horizon, deep purple and gold sky, soft fog rolling over calm water, ethereal atmosphere",
      camera_timeline: [
        {
          timestamp_pct: 0.0,
          position: { x: 0, y: 5, z: 20 },
          look_at: { x: 0, y: 2, z: 0 },
          transition: "smooth",
          description: "Opening — distant view of the world",
        },
        {
          timestamp_pct: 1.0,
          position: { x: 0, y: 3, z: 5 },
          look_at: { x: 0, y: 1, z: -5 },
          transition: "smooth",
          description: "Ending — close and intimate",
        },
      ],
    };

    const result = parseWorldConfig(JSON.stringify(input));
    expect(result.world.terrain.type).toBe("ocean");
    expect(result.world.palette.primary).toBe("#1a1a2e");
    expect(result.camera_timeline).toHaveLength(2);
    expect(result.camera_timeline[0].timestamp_pct).toBe(0.0);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseWorldConfig("not json")).toThrow();
  });

  it("throws when required fields are missing", () => {
    expect(() => parseWorldConfig(JSON.stringify({ world: {} }))).toThrow();
  });
});
