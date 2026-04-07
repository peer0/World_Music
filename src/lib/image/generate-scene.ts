const REPLICATE_API_BASE = "https://api.replicate.com/v1";

async function pollReplicatePrediction(
  id: string,
  apiToken: string,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${REPLICATE_API_BASE}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) throw new Error(`Replicate poll error: ${res.status}`);

    const data = await res.json();

    if (data.status === "succeeded") {
      // Flux output is typically an array with one URL
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!output) throw new Error("Replicate returned empty output");
      return output;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction failed: ${data.error || "unknown"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Replicate prediction timed out");
}

export async function generateSceneImage(prompt: string): Promise<string | null> {
  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    console.log("No REPLICATE_API_TOKEN set — skipping scene image generation");
    return null;
  }

  try {
    // Use Flux Schnell for fast, high-quality image generation
    const res = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "2:1", // Equirectangular panorama aspect ratio
          output_format: "jpg",
          output_quality: 90,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Replicate API error: ${res.status} ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return await pollReplicatePrediction(data.id, apiToken);
  } catch (err) {
    console.error("Scene image generation failed:", err);
    return null;
  }
}
