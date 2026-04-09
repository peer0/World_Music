export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TerrainConfig {
  type: "ocean" | "plains" | "mountains" | "forest" | "desert" | "urban" | "abstract" | "void";
  variation: string;
  scale: number;
}

export interface AtmosphereConfig {
  time_of_day: "dawn" | "morning" | "afternoon" | "dusk" | "night" | "timeless";
  weather: "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
  fog_density: number;
  wind_strength: number;
}

export interface PaletteConfig {
  primary: string;
  secondary: string;
  accent: string;
  ambient_light: string;
  directional_light: string;
}

export interface ParticleConfig {
  type: "none" | "rain" | "snow" | "fireflies" | "petals" | "dust" | "stars" | "embers";
  density: number;
  speed: number;
}

export interface WorldObject {
  type: "tree" | "rock" | "water_body" | "structure" | "light_source" | "abstract_shape";
  subtype: string;
  position_hint: "center" | "scattered" | "horizon" | "overhead";
  scale: number;
}

export interface MoodConfig {
  primary_emotion: string;
  intensity: number;
  description: string;
}

export interface CameraKeyframe {
  timestamp_pct: number;
  position: Vec3;
  look_at: Vec3;
  transition: "smooth" | "cut";
  description: string;
}

export interface SceneImageSpec {
  scene_description: string;
  style: "photorealistic" | "painterly" | "anime" | "dreamlike" | "watercolor";
  panorama_prompt: string;
  depth_layers: string[];
}

export interface WorldModelRange {
  from: number;
  to: number;
}

export interface WorldModelDynamics {
  fog_density?: WorldModelRange;
  wind_strength?: WorldModelRange;
  particle_density?: WorldModelRange;
  particle_speed?: WorldModelRange;
  mood_intensity?: WorldModelRange;
}

export interface WorldModelConfig {
  enabled: boolean;
  progression: "linear" | "ease-in-out";
  dynamics: WorldModelDynamics;
  narrative_arc: string[];
}

export interface WorldConfig {
  world: {
    terrain: TerrainConfig;
    atmosphere: AtmosphereConfig;
    palette: PaletteConfig;
    particles: ParticleConfig;
    objects: WorldObject[];
    mood: MoodConfig;
  };
  scene_image?: SceneImageSpec;
  world_model?: WorldModelConfig;
  skybox_prompt: string;
  camera_timeline: CameraKeyframe[];
}

export function parseWorldConfig(json: string): WorldConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON string");
  }

  const config = parsed as Record<string, unknown>;

  if (
    !config.world ||
    typeof config.world !== "object" ||
    !config.skybox_prompt ||
    !config.camera_timeline
  ) {
    throw new Error("Missing required fields: world, skybox_prompt, camera_timeline");
  }

  const world = config.world as Record<string, unknown>;
  if (!world.terrain || !world.atmosphere || !world.palette || !world.particles || !world.mood) {
    throw new Error("Missing required world fields: terrain, atmosphere, palette, particles, mood");
  }

  return parsed as WorldConfig;
}
