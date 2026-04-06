const BLOCKADE_API_BASE = "https://backend.blockadelabs.com/api/v1";

async function pollForCompletion(
  id: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${BLOCKADE_API_BASE}/imagine/requests/${id}?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`Skybox API error: ${res.status}`);

    const data = await res.json();

    if (data.status === "complete") {
      return data.file_url;
    }
    if (data.status === "error") {
      throw new Error(`Skybox generation failed: ${data.error_message || "unknown"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Skybox generation timed out");
}

export async function generateSkybox(prompt: string): Promise<string> {
  const apiKey = process.env.BLOCKADE_LABS_API_KEY;
  if (!apiKey) throw new Error("BLOCKADE_LABS_API_KEY not set");

  const res = await fetch(`${BLOCKADE_API_BASE}/imagine/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      generator: "stable-skybox",
      prompt,
    }),
  });

  if (!res.ok) throw new Error(`Skybox API error: ${res.status}`);

  const data = await res.json();
  return pollForCompletion(data.id, apiKey);
}
