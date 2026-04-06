import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSkybox } from "@/lib/skybox/generate-skybox";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("generateSkybox", () => {
  beforeEach(() => {
    vi.stubEnv("BLOCKADE_LABS_API_KEY", "test-key");
    mockFetch.mockReset();
  });

  it("returns a skybox image URL from a prompt", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "gen-123" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "complete",
        file_url: "https://skybox.blockadelabs.com/result-123.jpg",
      }),
    });

    const url = await generateSkybox(
      "360 equirectangular panorama, twilight ocean, purple sky"
    );

    expect(url).toBe("https://skybox.blockadelabs.com/result-123.jpg");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(
      generateSkybox("test prompt")
    ).rejects.toThrow("Skybox API error: 401");
  });
});
