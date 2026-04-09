import type { WorldModelRange } from "@/lib/types";

interface StrengthenOptions {
  minSpread: number;
  floor: number;
  ceil: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function strengthenRange(
  input: WorldModelRange | undefined,
  fallback: WorldModelRange,
  options: StrengthenOptions
): WorldModelRange {
  const boundedFloor = clamp01(options.floor);
  const boundedCeil = clamp01(options.ceil);
  const spread = Math.max(0, options.minSpread);

  const source = input ?? fallback;
  const sourceFrom = clamp01(source.from);
  const sourceTo = clamp01(source.to);

  const loweredFrom = Math.max(boundedFloor, sourceFrom - 0.1);
  const maxFromAllowed = Math.max(boundedFloor, boundedCeil - spread);
  const from = Math.min(loweredFrom, maxFromAllowed);

  const raisedTo = Math.max(sourceTo + 0.15, from + spread);
  const to = Math.min(boundedCeil, raisedTo);

  return {
    from: clamp01(from),
    to: clamp01(Math.max(to, from)),
  };
}
