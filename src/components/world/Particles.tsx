"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ParticleConfig, PaletteConfig } from "@/lib/types";

interface ParticlesProps {
  config: ParticleConfig;
  palette: PaletteConfig;
}

const PARTICLE_COUNT = 2000;

export function Particles({ config, palette }: ParticlesProps) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  const particleColor = useMemo(() => {
    switch (config.type) {
      case "rain": return "#aaccff";
      case "snow": return "#ffffff";
      case "fireflies": return "#ffee88";
      case "petals": return palette.accent;
      case "dust": return "#ccbbaa";
      case "stars": return "#ffffff";
      case "embers": return "#ff6633";
      default: return "#ffffff";
    }
  }, [config.type, palette.accent]);

  const particleSize = useMemo(() => {
    switch (config.type) {
      case "rain": return 0.05;
      case "snow": return 0.15;
      case "fireflies": return 0.2;
      case "petals": return 0.2;
      case "stars": return 0.1;
      default: return 0.1;
    }
  }, [config.type]);

  useFrame((_, delta) => {
    if (!ref.current || config.type === "none") return;
    const pos = ref.current.geometry.attributes.position;
    const speed = config.speed * delta * 10;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = pos.getY(i);

      switch (config.type) {
        case "rain":
          pos.setY(i, y - speed * 5);
          if (y < 0) pos.setY(i, 50);
          break;
        case "snow":
          pos.setY(i, y - speed);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i) * 0.01);
          if (y < 0) pos.setY(i, 50);
          break;
        case "fireflies":
          pos.setY(i, y + Math.sin(Date.now() * 0.002 + i) * 0.02);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i * 0.5) * 0.01);
          break;
        case "petals":
          pos.setY(i, y - speed * 0.5);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i) * 0.02);
          if (y < 0) pos.setY(i, 30);
          break;
        case "embers":
          pos.setY(i, y + speed * 2);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.003 + i) * 0.01);
          if (y > 50) pos.setY(i, 0);
          break;
        case "stars":
          break;
        case "dust":
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.0005 + i) * 0.005);
          pos.setY(i, y + Math.sin(Date.now() * 0.001 + i * 0.3) * 0.005);
          break;
      }
    }
    pos.needsUpdate = true;
  });

  if (config.type === "none") return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        color={particleColor}
        transparent
        opacity={config.density}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
