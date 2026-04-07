"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface DepthPanoramaProps {
  imageUrl: string;
  depthUrl: string | null;
  displacementScale?: number;
}

const vertexShader = `
  uniform sampler2D depthMap;
  uniform float displacementScale;
  uniform float time;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Sample depth map — white = far, black = near
    float depth = texture2D(depthMap, uv).r;

    // Displace vertices inward based on depth (closer objects push inward)
    // This creates parallax when camera moves
    float displacement = (1.0 - depth) * displacementScale;
    pos = pos * (1.0 - displacement);

    // Subtle breathing animation
    pos += normal * sin(time * 0.3 + depth * 6.28) * 0.02;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D panoramaMap;
  uniform float fogDensity;
  uniform vec3 fogColor;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(panoramaMap, vUv);

    // Apply slight fog blending at edges
    float fogFactor = 1.0 - exp(-fogDensity * 0.5);
    vec3 finalColor = mix(texColor.rgb, fogColor, fogFactor * 0.15);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Fallback: white depth map (no displacement)
function createWhiteTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 2, 2);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function DepthPanorama({
  imageUrl,
  depthUrl,
  displacementScale = 0.15,
}: DepthPanoramaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  const panoramaTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(imageUrl);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [imageUrl]);

  const depthTexture = useMemo(() => {
    if (depthUrl) {
      return new THREE.TextureLoader().load(depthUrl);
    }
    return createWhiteTexture();
  }, [depthUrl]);

  const uniforms = useMemo(
    () => ({
      panoramaMap: { value: panoramaTexture },
      depthMap: { value: depthTexture },
      displacementScale: { value: displacementScale },
      time: { value: 0 },
      fogDensity: { value: 0.3 },
      fogColor: { value: new THREE.Color("#1a1a2e") },
    }),
    [panoramaTexture, depthTexture, displacementScale]
  );

  // Also set the panorama as scene background for areas not covered by the mesh
  useMemo(() => {
    scene.background = panoramaTexture.clone();
    scene.background.mapping = THREE.EquirectangularReflectionMapping;
    return () => {
      scene.background = null;
    };
  }, [panoramaTexture, scene]);

  useFrame((_, delta) => {
    if (uniforms.time) {
      uniforms.time.value += delta;
    }
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 128, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
