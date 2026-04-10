import { Buffer } from "node:buffer";

interface HuggingFaceErrorResponse {
  error?: string;
}

export async function generateSceneImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.log("No HUGGINGFACE_API_KEY set — skipping scene image generation");
    return null;
  }

  const model = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 4,
          guidance_scale: 0,
        },
        options: {
          wait_for_model: true,
          use_cache: false,
        },
      }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as HuggingFaceErrorResponse;
        throw new Error(`Hugging Face API error: ${data.error || response.status}`);
      }

      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected Hugging Face response type: ${contentType || "unknown"}`);
    }

    const imageBytes = await response.arrayBuffer();
    const base64 = Buffer.from(imageBytes).toString("base64");

    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.error("Scene image generation failed:", err);
    return null;
  }
}
