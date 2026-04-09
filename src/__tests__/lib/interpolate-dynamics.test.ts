import { describe, it, expect } from "vitest";
import { resolveRuntimeWorldState } from "@/lib/world-model/interpolate-dynamics";
import type { WorldConfig } from "@/lib/types";

const baseConfig: WorldConfig = {
  world: {
    terrain: { type: "plains", variation: "soft hills", scale: 0.5 },
    atmosphere: { time_of_day: "dusk", weather: "fog", fog_density: 0.3, wind_strength: 0.2 },
    palette: {
      primary: "#101020",
      secondary: "#303050",
      accent: "#ff99cc",
      ambient_light: "#202040",
      directional_light: "#ffd6a5",
    },
    particles: { type: "fireflies", density: 0.25, speed: 0.2 },
    objects: [
      { type: "tree", subtype: "silent tree", position_hint: "scattered", scale: 0.5 },
    ],
    mood: {
      primary_emotion: "wonder",
      intensity: 0.4,
      description: "soft and reflective",
    },
  },
  skybox_prompt: "360 equirectangular panorama, dusk hills and fog",
  camera_timeline: [
    {
      timestamp_pct: 0,
      position: { x: 0, y: 6, z: 20 },
      look_at: { x: 0, y: 2, z: 0 },
      transition: "smooth",
      description: "opening",
    },
    {
      timestamp_pct: 1,
      position: { x: 2, y: 3, z: 5 },
      look_at: { x: 0, y: 1, z: -3 },
      transition: "smooth",
      description: "ending",
    },
  ],
};

describe("resolveRuntimeWorldState", () => {
  it("returns base world state when world_model is absent", () => {
    const state = resolveRuntimeWorldState(baseConfig, 0.5);

    expect(state.fogDensity).toBe(0.3);
    expect(state.windStrength).toBe(0.2);
    expect(state.particleDensity).toBe(0.25);
    expect(state.particleSpeed).toBe(0.2);
    expect(state.moodIntensity).toBe(0.4);
  });

  it("interpolates dynamics when world_model is enabled", () => {
    const config: WorldConfig = {
      ...baseConfig,
      world_model: {
        enabled: true,
        progression: "linear",
        dynamics: {
          fog_density: { from: 0.1, to: 0.5 },
          wind_strength: { from: 0.2, to: 0.4 },
          particle_density: { from: 0.25, to: 0.65 },
          particle_speed: { from: 0.1, to: 0.5 },
          mood_intensity: { from: 0.35, to: 0.95 },
        },
        narrative_arc: ["arrival", "immersion", "echo"],
      },
    };

    const state = resolveRuntimeWorldState(config, 0.5);

    expect(state.fogDensity).toBeCloseTo(0.3);
    expect(state.windStrength).toBeCloseTo(0.3);
    expect(state.particleDensity).toBeCloseTo(0.45);
    expect(state.particleSpeed).toBeCloseTo(0.3);
    expect(state.moodIntensity).toBeCloseTo(0.65);
  });
});
