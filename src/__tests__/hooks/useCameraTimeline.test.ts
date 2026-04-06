import { describe, it, expect } from "vitest";
import { interpolateTimeline } from "@/hooks/useCameraTimeline";
import type { CameraKeyframe } from "@/lib/types";

const timeline: CameraKeyframe[] = [
  {
    timestamp_pct: 0.0,
    position: { x: 0, y: 10, z: 20 },
    look_at: { x: 0, y: 2, z: 0 },
    transition: "smooth",
    description: "start",
  },
  {
    timestamp_pct: 0.5,
    position: { x: 0, y: 5, z: 10 },
    look_at: { x: 0, y: 1, z: -5 },
    transition: "smooth",
    description: "middle",
  },
  {
    timestamp_pct: 1.0,
    position: { x: 0, y: 3, z: 5 },
    look_at: { x: 0, y: 1, z: -10 },
    transition: "smooth",
    description: "end",
  },
];

describe("interpolateTimeline", () => {
  it("returns first keyframe at t=0", () => {
    const result = interpolateTimeline(timeline, 0.0);
    expect(result.position).toEqual({ x: 0, y: 10, z: 20 });
    expect(result.look_at).toEqual({ x: 0, y: 2, z: 0 });
  });

  it("returns last keyframe at t=1", () => {
    const result = interpolateTimeline(timeline, 1.0);
    expect(result.position).toEqual({ x: 0, y: 3, z: 5 });
  });

  it("interpolates midpoint between keyframes", () => {
    const result = interpolateTimeline(timeline, 0.25);
    expect(result.position.y).toBeCloseTo(7.5, 1);
    expect(result.position.z).toBeCloseTo(15, 1);
  });

  it("clamps below 0", () => {
    const result = interpolateTimeline(timeline, -0.5);
    expect(result.position).toEqual({ x: 0, y: 10, z: 20 });
  });

  it("clamps above 1", () => {
    const result = interpolateTimeline(timeline, 1.5);
    expect(result.position).toEqual({ x: 0, y: 3, z: 5 });
  });
});
