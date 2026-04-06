"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { interpolateTimeline, type InterpolatedCamera } from "@/hooks/useCameraTimeline";
import type { CameraKeyframe } from "@/lib/types";

interface CameraControllerProps {
  timeline: CameraKeyframe[];
  progress: number;
  mode: "guided" | "free";
}

export function CameraController({ timeline, progress, mode }: CameraControllerProps) {
  const { camera } = useThree();
  const targetRef = useRef<InterpolatedCamera | null>(null);

  useFrame(() => {
    if (mode !== "guided") return;

    const target = interpolateTimeline(timeline, progress);
    targetRef.current = target;

    camera.position.lerp(
      new THREE.Vector3(target.position.x, target.position.y, target.position.z),
      0.03
    );

    const lookTarget = new THREE.Vector3(target.look_at.x, target.look_at.y, target.look_at.z);
    camera.lookAt(lookTarget);
  });

  if (mode === "free") {
    return (
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI * 0.85}
        minDistance={2}
        maxDistance={100}
      />
    );
  }

  return null;
}
