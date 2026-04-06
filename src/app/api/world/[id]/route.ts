import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const world = await prisma.world.findUnique({ where: { id } });

  if (!world) {
    return NextResponse.json({ error: "World not found" }, { status: 404 });
  }

  return NextResponse.json(world);
}
