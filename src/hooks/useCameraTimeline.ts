"use client";

import { useCallback } from "react";
import type { CameraKeyframe, Vec3 } from "@/lib/types";

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export interface InterpolatedCamera {
  position: Vec3;
  look_at: Vec3;
}

export function interpolateTimeline(
  timeline: CameraKeyframe[],
  t: number
): InterpolatedCamera {
  const clamped = Math.max(0, Math.min(1, t));

  if (clamped <= timeline[0].timestamp_pct) {
    return { position: timeline[0].position, look_at: timeline[0].look_at };
  }

  const last = timeline[timeline.length - 1];
  if (clamped >= last.timestamp_pct) {
    return { position: last.position, look_at: last.look_at };
  }

  let i = 0;
  while (i < timeline.length - 1 && timeline[i + 1].timestamp_pct <= clamped) {
    i++;
  }

  const from = timeline[i];
  const to = timeline[i + 1];
  const segmentT =
    (clamped - from.timestamp_pct) / (to.timestamp_pct - from.timestamp_pct);

  return {
    position: lerpVec3(from.position, to.position, segmentT),
    look_at: lerpVec3(from.look_at, to.look_at, segmentT),
  };
}

export function useCameraTimeline(timeline: CameraKeyframe[]) {
  const getCamera = useCallback(
    (t: number) => interpolateTimeline(timeline, t),
    [timeline]
  );

  return { getCamera };
}
