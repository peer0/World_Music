import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { interpretLetter } from "@/lib/ai/interpret-letter";
import { generateSkybox } from "@/lib/skybox/generate-skybox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { letter, songTitle, artist, youtubeUrl, userId } = body;

    if (!letter || !songTitle || !artist || !youtubeUrl || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: letter, songTitle, artist, youtubeUrl, userId" },
        { status: 400 }
      );
    }

    const worldConfig = await interpretLetter({ letter, songTitle, artist });

    let skyboxUrl: string | null = null;
    try {
      skyboxUrl = await generateSkybox(worldConfig.skybox_prompt);
    } catch (err) {
      console.error("Skybox generation failed, continuing without:", err);
    }

    const world = await prisma.world.create({
      data: {
        title: songTitle,
        artist,
        youtubeUrl,
        letter,
        worldConfig: JSON.stringify(worldConfig),
        skyboxUrl,
        userId,
      },
    });

    return NextResponse.json({ id: world.id, worldConfig, skyboxUrl });
  } catch (err) {
    console.error("World generation failed:", err);
    return NextResponse.json({ error: "World generation failed" }, { status: 500 });
  }
}
