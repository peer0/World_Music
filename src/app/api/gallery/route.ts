import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const worlds = await prisma.world.findMany({
    where: { userId, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      artist: true,
      thumbnailUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ worlds });
}
