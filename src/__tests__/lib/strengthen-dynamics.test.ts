import { describe, it, expect } from "vitest";
import { strengthenRange } from "@/lib/world-model/strengthen-dynamics";

describe("strengthenRange", () => {
  it("ensures minimum spread for normal-range input", () => {
    const result = strengthenRange(
      { from: 0.3, to: 0.45 },
      { from: 0.2, to: 0.6 },
      { minSpread: 0.35, floor: 0.05, ceil: 0.95 }
    );

    expect(result.to - result.from).toBeGreaterThanOrEqual(0.35);
  });

  it("maintains minimum spread near upper boundary by lowering from", () => {
    const result = strengthenRange(
      { from: 0.95, to: 0.97 },
      { from: 0.2, to: 0.6 },
      { minSpread: 0.35, floor: 0.05, ceil: 1.0 }
    );

    expect(result.to).toBeLessThanOrEqual(1);
    expect(result.to - result.from).toBeGreaterThanOrEqual(0.35);
  });
});
