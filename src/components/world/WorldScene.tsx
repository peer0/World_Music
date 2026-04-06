"use client";

import { Canvas } from "@react-three/fiber";
import type { WorldConfig } from "@/lib/types";
import { Terrain } from "./Terrain";
import { Skybox } from "./Skybox";
import { Particles } from "./Particles";
import { Atmosphere } from "./Atmosphere";
import { WorldObjects } from "./WorldObjects";
import { CameraController } from "./CameraController";

interface WorldSceneProps {
  config: WorldConfig;
  skyboxUrl: string | null;
  progress: number;
  mode: "guided" | "free";
}

export function WorldScene({ config, skyboxUrl, progress, mode }: WorldSceneProps) {
  const { world } = config;

  return (
    <Canvas
      camera={{ position: [0, 10, 20], fov: 60, near: 0.1, far: 500 }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <Skybox url={skyboxUrl} fallbackColor={world.palette.primary} />
      <Atmosphere atmosphere={world.atmosphere} palette={world.palette} />
      <Terrain terrain={world.terrain} palette={world.palette} />
      <WorldObjects objects={world.objects} palette={world.palette} />
      <Particles config={world.particles} palette={world.palette} />
      <CameraController timeline={config.camera_timeline} progress={progress} mode={mode} />
    </Canvas>
  );
}
