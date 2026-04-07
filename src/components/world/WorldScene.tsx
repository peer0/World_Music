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
  depthMapUrl,
  progress,
  mode,
}: WorldSceneProps) {
  const { world } = config;
  const useDepthPanorama = !!sceneImageUrl;

  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 70, near: 0.1, far: 200 }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      {useDepthPanorama ? (
        // AI image-based world: panorama + depth displacement
        <DepthPanorama
          imageUrl={sceneImageUrl}
          depthUrl={depthMapUrl ?? null}
        />
      ) : (
        // Fallback: procedural world (basic shapes)
        <>
          <Skybox url={skyboxUrl} fallbackColor={world.palette.primary} />
          <Terrain terrain={world.terrain} palette={world.palette} />
          <WorldObjects objects={world.objects} palette={world.palette} />
        </>
      )}
      <Atmosphere atmosphere={world.atmosphere} palette={world.palette} />
      <Particles config={world.particles} palette={world.palette} />
      <CameraController
        timeline={config.camera_timeline}
        progress={progress}
        mode={mode}
      />
    </Canvas>
  );
}
