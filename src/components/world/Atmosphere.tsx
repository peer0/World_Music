"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import type { AtmosphereConfig, PaletteConfig } from "@/lib/types";

interface AtmosphereProps {
  atmosphere: AtmosphereConfig;
  palette: PaletteConfig;
}

export function Atmosphere({ atmosphere, palette }: AtmosphereProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (atmosphere.fog_density > 0) {
      scene.fog = new THREE.FogExp2(palette.primary, atmosphere.fog_density * 0.05);
    } else {
      scene.fog = null;
    }
    return () => {
      scene.fog = null;
    };
  }, [atmosphere.fog_density, palette.primary, scene]);

  const ambientIntensity = (() => {
    switch (atmosphere.time_of_day) {
      case "night": return 0.2;
      case "dusk": case "dawn": return 0.4;
      default: return 0.6;
    }
  })();

  const directionalIntensity = (() => {
    switch (atmosphere.time_of_day) {
      case "night": return 0.3;
      case "dusk": case "dawn": return 0.7;
      default: return 1.0;
    }
  })();

  const sunPosition: [number, number, number] = (() => {
    switch (atmosphere.time_of_day) {
      case "dawn": return [50, 10, 0];
      case "morning": return [50, 30, 20];
      case "afternoon": return [0, 50, -20];
      case "dusk": return [-50, 10, 0];
      case "night": return [0, -10, 0];
      case "timeless": return [0, 50, 0];
      default: return [0, 50, 0];
    }
  })();

  return (
    <>
      <ambientLight color={palette.ambient_light} intensity={ambientIntensity} />
      <directionalLight
        color={palette.directional_light}
        intensity={directionalIntensity}
        position={sunPosition}
        castShadow
      />
    </>
  );
}
