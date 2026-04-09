import { describe, it, expect } from "vitest";
import { resolveRuntimeWorldState } from "@/lib/world-model/interpolate-dynamics";
import type { WorldConfig } from "@/lib/types";

describe("World Model Demo: Music-Driven World Evolution", () => {
  // Example world config with world model enabled
  const baseConfig: WorldConfig = {
    world: {
      terrain: { type: "plains", variation: "soft hills", scale: 0.5 },
      atmosphere: { time_of_day: "morning", weather: "clear", fog_density: 0.1, wind_strength: 0.1 },
      palette: {
        primary: "#8fbc8f", secondary: "#deb887", accent: "#ffd700",
        ambient_light: "#fffff0", directional_light: "#ffffff",
      },
      particles: { type: "fireflies", density: 0.2, speed: 0.2 },
      objects: [{ type: "tree", subtype: "singing tree", position_hint: "center", scale: 0.5 }],
      mood: { primary_emotion: "hope", intensity: 0.3, description: "A hopeful musical journey" },
    },
    skybox_prompt: "360 degree equirectangular panorama, hopeful morning light, soft hills, golden accent fireflies",
    camera_timeline: [
      { timestamp_pct: 0.0, position: { x: 0, y: 6, z: 20 }, look_at: { x: 0, y: 2, z: 0 }, transition: "smooth", description: "Song start" },
      { timestamp_pct: 0.5, position: { x: 2, y: 4, z: 10 }, look_at: { x: 0, y: 2, z: 0 }, transition: "smooth", description: "Mid-song swell" },
      { timestamp_pct: 1.0, position: { x: 0, y: 3, z: 5 }, look_at: { x: 0, y: 1, z: -3 }, transition: "smooth", description: "Song end" },
    ],
    // WORLD MODEL CONFIGURATION - This is what makes the world evolve with music
    world_model: {
      enabled: true,
      progression: "ease-in-out",
      dynamics: {
        fog_density: { from: 0.1, to: 0.6 },      // Fog increases as music progresses
        wind_strength: { from: 0.1, to: 0.5 },    // Wind picks up with crescendos
        particle_density: { from: 0.2, to: 0.7 }, // More fireflies as music intensifies
        particle_speed: { from: 0.2, to: 0.6 },   // Fireflies dance faster
        mood_intensity: { from: 0.3, to: 0.9 },   // Emotional impact builds
      },
      narrative_arc: [
        "Gentle beginning - like a soft piano introduction",
        "Building hope - strings and harmony emerge", 
        "Fulfilling resolution - warm and complete"
      ],
    },
  };

  it("demonstrates world evolution from song start to finish", () => {
    // Song start (0% progress)
    const startState = resolveRuntimeWorldState(baseConfig, 0.0);
    
    // Song middle (50% progress) 
    const middleState = resolveRuntimeWorldState(baseConfig, 0.5);
    
    // Song end (100% progress)
    const endState = resolveRuntimeWorldState(baseConfig, 1.0);

    // Verify the world actually changes over time - this is the core requirement
    expect(startState.fogDensity).toBeCloseTo(0.1);     // Starting fog
    expect(middleState.fogDensity).toBeGreaterThan(startState.fogDensity);
    expect(endState.fogDensity).toBeCloseTo(0.6);       // End fog
    
    expect(startState.windStrength).toBeCloseTo(0.1);   // Starting wind
    expect(middleState.windStrength).toBeGreaterThan(startState.windStrength);
    expect(endState.windStrength).toBeCloseTo(0.5);     // End wind
    
    expect(startState.particleDensity).toBeCloseTo(0.2); // Starting particle density
    expect(middleState.particleDensity).toBeGreaterThan(startState.particleDensity);
    expect(endState.particleDensity).toBeCloseTo(0.7);   // End particle density
    
    expect(startState.particleSpeed).toBeCloseTo(0.2);   // Starting particle speed
    expect(middleState.particleSpeed).toBeGreaterThan(startState.particleSpeed);
    expect(endState.particleSpeed).toBeCloseTo(0.6);     // End particle speed
    
    expect(startState.moodIntensity).toBeCloseTo(0.3);   // Starting emotional intensity
    expect(middleState.moodIntensity).toBeGreaterThan(startState.moodIntensity);
    expect(endState.moodIntensity).toBeCloseTo(0.9);     // End emotional intensity

    // Verify that without world model, nothing changes (backward compatibility)
    const configWithoutWorldModel = { ...baseConfig, world_model: undefined };
    const noChangeStart = resolveRuntimeWorldState(configWithoutWorldModel, 0.0);
    const noChangeEnd = resolveRuntimeWorldState(configWithoutWorldModel, 1.0);
    
    expect(noChangeStart).toEqual(noChangeEnd); // Identical - no evolution without world model
  });

  it("shows different progression types affect evolution curve", () => {
    const linearConfig = { ...baseConfig, world_model: { ...baseConfig.world_model!, progression: "linear" } };
    const easeConfig = { ...baseConfig, world_model: { ...baseConfig.world_model!, progression: "ease-in-out" } };
    
    const linearMid = resolveRuntimeWorldState(linearConfig, 0.3);
    const easeMid = resolveRuntimeWorldState(easeConfig, 0.3);
    
    // Ease-in-out should start slower than linear in early progression
    expect(easeMid.fogDensity).toBeLessThan(linearMid.fogDensity); // Slower start
    
    const linearThreeQuarter = resolveRuntimeWorldState(linearConfig, 0.7);
    const easeThreeQuarter = resolveRuntimeWorldState(easeConfig, 0.7);
    
    expect(easeThreeQuarter.fogDensity).toBeGreaterThan(linearThreeQuarter.fogDensity); // Faster end
  });
});