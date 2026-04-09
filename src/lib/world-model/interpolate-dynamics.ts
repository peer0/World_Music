import type { WorldConfig } from "@/lib/types";

interface RuntimeWorldState {
  fogDensity: number;
  windStrength: number;
  particleDensity: number;
  particleSpeed: number;
  moodIntensity: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function resolveRuntimeWorldState(config: WorldConfig, progress: number): RuntimeWorldState {
  const clampedProgress = clamp01(progress);
  const worldModel = config.world_model;

  if (!worldModel?.enabled) {
    return {
      fogDensity: config.world.atmosphere.fog_density,
      windStrength: config.world.atmosphere.wind_strength,
      particleDensity: config.world.particles.density,
      particleSpeed: config.world.particles.speed,
      moodIntensity: config.world.mood.intensity,
    };
  }

  const t = worldModel.progression === "ease-in-out" ? easeInOut(clampedProgress) : clampedProgress;
  const dynamics = worldModel.dynamics;

  const fogDensity = dynamics?.fog_density
    ? lerp(dynamics.fog_density.from, dynamics.fog_density.to, t)
    : config.world.atmosphere.fog_density;

  const windStrength = dynamics?.wind_strength
    ? lerp(dynamics.wind_strength.from, dynamics.wind_strength.to, t)
    : config.world.atmosphere.wind_strength;

  const particleDensity = dynamics?.particle_density
    ? lerp(dynamics.particle_density.from, dynamics.particle_density.to, t)
    : config.world.particles.density;

  const particleSpeed = dynamics?.particle_speed
    ? lerp(dynamics.particle_speed.from, dynamics.particle_speed.to, t)
    : config.world.particles.speed;

  const moodIntensity = dynamics?.mood_intensity
    ? lerp(dynamics.mood_intensity.from, dynamics.mood_intensity.to, t)
    : config.world.mood.intensity;

  return {
    fogDensity: clamp01(fogDensity),
    windStrength: clamp01(windStrength),
    particleDensity: clamp01(particleDensity),
    particleSpeed: clamp01(particleSpeed),
    moodIntensity: clamp01(moodIntensity),
  };
}
