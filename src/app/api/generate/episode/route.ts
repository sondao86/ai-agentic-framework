import { NextRequest, NextResponse } from "next/server";
import { generateEpisode } from "@/lib/content-pipeline";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workstream, episodeNumber, title, bibleVerses, keywords, lens } = body;

    if (!workstream || !episodeNumber || !title || !bibleVerses || !keywords || !lens) {
      return NextResponse.json(
        {
          error: "Missing required fields: workstream, episodeNumber, title, bibleVerses, keywords, lens",
        },
        { status: 400 }
      );
    }

    const episode = await generateEpisode({
      workstream,
      episodeNumber,
      title,
      bibleVerses,
      keywords,
      lens,
    });

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error("POST /api/generate/episode error:", error);
    return NextResponse.json(
      { error: "Failed to generate episode", details: String(error) },
      { status: 500 }
    );
  }
}
