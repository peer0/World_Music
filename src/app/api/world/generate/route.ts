import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { interpretLetter } from "@/lib/ai/interpret-letter";
import { generateSkybox } from "@/lib/skybox/generate-skybox";
import { generateSceneImage } from "@/lib/image/generate-scene";
// import { estimateDepth } from "@/lib/image/estimate-depth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { letter, songTitle, artist, youtubeUrl, userId, worldModelMode } = body;
    const allowedModes = ["classic", "dynamic", "generative"] as const;
    const isAllowedMode = (mode: unknown): mode is (typeof allowedModes)[number] =>
      typeof mode === "string" && allowedModes.some((allowedMode) => allowedMode === mode);
    const normalizedMode = isAllowedMode(worldModelMode) ? worldModelMode : "dynamic";

    if (!letter || !songTitle || !artist || !youtubeUrl || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: letter, songTitle, artist, youtubeUrl, userId" },
        { status: 400 }
      );
    }

    // Step 1: Interpret letter with AI
    const worldConfig = await interpretLetter({
      letter,
      songTitle,
      artist,
      worldModelMode: normalizedMode,
    });

    // Step 2: Generate scene image (panorama) — primary visual
    const scenePrompt = worldConfig.scene_image?.panorama_prompt || worldConfig.skybox_prompt;
    let sceneImageUrl: string | null = null;
    const depthMapUrl: string | null = null;

    sceneImageUrl = await generateSceneImage(scenePrompt);

    // Step 3: Depth map — skip for now (parallax works without it)
    // TODO: Add GCP-based depth estimation later

    // Step 4: Fallback to skybox if no scene image
    let skyboxUrl: string | null = null;
    if (!sceneImageUrl) {
      try {
        skyboxUrl = await generateSkybox(worldConfig.skybox_prompt);
      } catch (err) {
        console.error("Skybox generation failed:", err);
      }
    }

    // Step 5: Save to database
    const world = await prisma.world.create({
      data: {
        title: songTitle,
        artist,
        youtubeUrl,
        letter,
        worldConfig: JSON.stringify(worldConfig),
        skyboxUrl,
        sceneImageUrl,
        depthMapUrl,
        userId,
      },
    });

    return NextResponse.json({
      id: world.id,
      worldConfig,
      skyboxUrl,
      sceneImageUrl,
      depthMapUrl,
    });
  } catch (err) {
    console.error("World generation failed:", err);
    return NextResponse.json({ error: "World generation failed" }, { status: 500 });
  }
}
