"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { TerrainConfig, PaletteConfig } from "@/lib/types";

interface TerrainProps {
  terrain: TerrainConfig;
  palette: PaletteConfig;
}

export function Terrain({ terrain, palette }: TerrainProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 128, 128);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);

      let height = 0;
      const scale = terrain.scale;

      switch (terrain.type) {
        case "ocean":
          height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * scale * 0.5;
          break;
        case "mountains":
          height =
            (Math.sin(x * 0.02) * Math.cos(z * 0.03) +
              Math.sin(x * 0.05 + 1) * 0.5) *
            scale *
            15;
          break;
        case "plains":
          height =
            Math.sin(x * 0.01) * Math.cos(z * 0.01) * scale * 2;
          break;
        case "forest":
          height =
            (Math.sin(x * 0.03) * Math.cos(z * 0.02) +
              Math.random() * 0.1) *
            scale *
            3;
          break;
        case "desert":
          height =
            Math.abs(Math.sin(x * 0.04) * Math.cos(z * 0.04)) * scale * 5;
          break;
        default:
          height = 0;
      }

      positions.setZ(i, height);
    }

    geo.computeVertexNormals();
    return geo;
  }, [terrain.type, terrain.scale]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geometry} />
      <meshStandardMaterial
        color={palette.primary}
        roughness={0.8}
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
}
