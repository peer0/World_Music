"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { WorldObject, PaletteConfig } from "@/lib/types";

interface WorldObjectsProps {
  objects: WorldObject[];
  palette: PaletteConfig;
}

function ObjectMesh({ obj, palette, index }: { obj: WorldObject; palette: PaletteConfig; index: number }) {
  const position = useMemo((): [number, number, number] => {
    const spread = 30;
    switch (obj.position_hint) {
      case "center": return [0, obj.scale * 2, 0];
      case "horizon": return [Math.cos(index * 1.5) * 50, obj.scale * 2, Math.sin(index * 1.5) * 50];
      case "overhead": return [(Math.random() - 0.5) * 20, 15 + obj.scale * 5, (Math.random() - 0.5) * 20];
      case "scattered":
      default: return [Math.cos(index * 2.4) * spread * Math.random(), obj.scale, Math.sin(index * 2.4) * spread * Math.random()];
    }
  }, [obj.position_hint, obj.scale, index]);

  const geometry = useMemo(() => {
    switch (obj.type) {
      case "tree": return new THREE.ConeGeometry(obj.scale * 2, obj.scale * 6, 6);
      case "rock": return new THREE.DodecahedronGeometry(obj.scale * 2, 0);
      case "structure": return new THREE.BoxGeometry(obj.scale * 4, obj.scale * 6, obj.scale * 4);
      case "light_source": return new THREE.SphereGeometry(obj.scale, 16, 16);
      case "abstract_shape": return new THREE.TorusKnotGeometry(obj.scale * 2, 0.5, 64, 8);
      case "water_body": return new THREE.CircleGeometry(obj.scale * 15, 32);
      default: return new THREE.SphereGeometry(obj.scale, 8, 8);
    }
  }, [obj.type, obj.scale]);

  const color = useMemo(() => {
    switch (obj.type) {
      case "tree": return "#2d5a27";
      case "rock": return "#666666";
      case "light_source": return palette.accent;
      case "water_body": return palette.secondary;
      default: return palette.primary;
    }
  }, [obj.type, palette]);

  const rotation: [number, number, number] = obj.type === "water_body" ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <primitive object={geometry} />
      <meshStandardMaterial
        color={color}
        roughness={obj.type === "light_source" ? 0.2 : 0.7}
        metalness={obj.type === "light_source" ? 0.8 : 0.1}
        emissive={obj.type === "light_source" ? palette.accent : "#000000"}
        emissiveIntensity={obj.type === "light_source" ? 0.5 : 0}
        transparent={obj.type === "water_body"}
        opacity={obj.type === "water_body" ? 0.6 : 1}
      />
    </mesh>
  );
}

export function WorldObjects({ objects, palette }: WorldObjectsProps) {
  return (
    <>
      {objects.map((obj, i) => (
        <ObjectMesh key={i} obj={obj} palette={palette} index={i} />
      ))}
    </>
  );
}
