"use client";

import { Canvas } from "@react-three/fiber";
import type { WorldConfig } from "@/lib/types";
import { DepthPanorama } from "./DepthPanorama";
import { Terrain } from "./Terrain";
import { Skybox } from "./Skybox";
import { Particles } from "./Particles";
import { Atmosphere } from "./Atmosphere";
import { WorldObjects } from "./WorldObjects";
import { CameraController } from "./CameraController";
import { resolveRuntimeWorldState } from "@/lib/world-model/interpolate-dynamics";

interface WorldSceneProps {
  config: WorldConfig;
  skyboxUrl: string | null;
  sceneImageUrl?: string | null;
  depthMapUrl?: string | null;
  progress: number;
  mode: "guided" | "free";
}

export function WorldScene({
  config,
  skyboxUrl,
  sceneImageUrl,
  progress,
  mode,
}: WorldSceneProps) {
  const { world } = config;
  const hasSceneImage = !!sceneImageUrl;
  const runtime = resolveRuntimeWorldState(config, progress);

  const runtimeAtmosphere = {
    ...world.atmosphere,
    fog_density: runtime.fogDensity,
    wind_strength: runtime.windStrength,
  };

  const runtimeParticles = {
    ...world.particles,
    density: runtime.particleDensity,
    speed: runtime.particleSpeed,
  };

  const runtimePalette = {
    ...world.palette,
    ambient_light:
      runtime.moodIntensity > 0.8
        ? world.palette.accent
        : world.palette.ambient_light,
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 0.1], fov: 75, near: 0.1, far: 200 }}
      style={{ width: "100%", height: "100%" }}
    >
      {hasSceneImage ? (
          // AI image-based world: full panorama as background
          <>
            <DepthPanorama imageUrl={sceneImageUrl} />
            <Particles config={runtimeParticles} palette={runtimePalette} />
          </>
        ) : (
          // Fallback: procedural world (basic shapes)
          <>
            <Skybox url={skyboxUrl} fallbackColor={world.palette.primary} />
            <Atmosphere atmosphere={runtimeAtmosphere} palette={runtimePalette} />
            <Terrain terrain={world.terrain} palette={world.palette} />
            <WorldObjects objects={world.objects} palette={runtimePalette} />
            <Particles config={runtimeParticles} palette={runtimePalette} />
          </>
        )}
      <CameraController
        timeline={config.camera_timeline}
        progress={progress}
        mode={mode}
      />
    </Canvas>
  );
}
