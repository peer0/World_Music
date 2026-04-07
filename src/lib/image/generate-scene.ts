import { GoogleGenAI } from "@google/genai";

export async function generateSceneImage(prompt: string): Promise<string | null> {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    console.log("No GOOGLE_CLOUD_PROJECT set — skipping scene image generation");
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });

    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No images generated");
    }

    const imageBytes = response.generatedImages[0].image?.imageBytes;
    if (!imageBytes) throw new Error("No image bytes in response");

    // Convert base64 to a data URL that Three.js can load
    return `data:image/png;base64,${imageBytes}`;
  } catch (err) {
    console.error("Scene image generation failed:", err);
    return null;
  }
}
