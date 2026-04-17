import { NextRequest, NextResponse } from "next/server";
import { verifyEpisode } from "@/lib/content-pipeline";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episodeId } = body;

    if (!episodeId) {
      return NextResponse.json(
        { error: "Missing required field: episodeId" },
        { status: 400 }
      );
    }

    const episode = await verifyEpisode(episodeId);

    return NextResponse.json(episode);
  } catch (error) {
    console.error("POST /api/generate/verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify episode", details: String(error) },
      { status: 500 }
    );
  }
}
