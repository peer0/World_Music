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
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!output) throw new Error("Replicate returned empty output");
      return output;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Depth estimation failed: ${data.error || "unknown"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Depth estimation timed out");
}

export async function estimateDepth(imageUrl: string): Promise<string | null> {
  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    console.log("No REPLICATE_API_TOKEN set — skipping depth estimation");
    return null;
  }

  try {
    // Use Depth Anything V2 for monocular depth estimation
    const res = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "7fa531bca41e251e6ace70a4af7dfdee6ad39162fc1a3bdf9ec08ede56edf085",
        input: {
          image: imageUrl,
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
    console.error("Depth estimation failed:", err);
    return null;
  }
}
