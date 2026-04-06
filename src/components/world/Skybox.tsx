"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

interface SkyboxProps {
  url: string | null;
  fallbackColor: string;
}

export function Skybox({ url, fallbackColor }: SkyboxProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (url) {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
      });
    } else {
      scene.background = new THREE.Color(fallbackColor);
    }

    return () => {
      scene.background = null;
    };
  }, [url, fallbackColor, scene]);

  return null;
}
