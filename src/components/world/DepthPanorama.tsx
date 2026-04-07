"use client";

import { useMemo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface DepthPanoramaProps {
  imageUrl: string;
}

export function DepthPanorama({ imageUrl }: DepthPanoramaProps) {
  const { scene } = useThree();

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [imageUrl]);

  useEffect(() => {
    scene.background = texture;
    return () => {
      scene.background = null;
    };
  }, [texture, scene]);

  // The panorama IS the world — rendered as scene.background
  // Three.js handles equirectangular mapping natively
  // Camera rotation = looking around inside the panorama
  return null;
}
