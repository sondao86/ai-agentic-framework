import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Episode from "@/models/Episode";

/**
 * GET /api/episodes
 * List episodes with optional filters: ?workstream=A|B&status=draft|verified|published
 * Sorted by workstream (asc) then episodeNumber (asc).
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const workstream = searchParams.get("workstream");
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};

    if (workstream && ["A", "B"].includes(workstream)) {
      filter.workstream = workstream;
    }

    if (status && ["draft", "verified", "published"].includes(status)) {
      filter.status = status;
    }

    const episodes = await Episode.find(filter)
      .sort({ workstream: 1, episodeNumber: 1 })
      .lean();

    return NextResponse.json(episodes);
  } catch (error) {
    console.error("GET /api/episodes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/episodes
 * Create a new episode. Accepts JSON body matching the Episode schema.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const episode = await Episode.create(body);

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error("POST /api/episodes error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    // Duplicate key (e.g. slug already exists)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === 11000
    ) {
      return NextResponse.json(
        { error: "An episode with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create episode" },
      { status: 500 }
    );
  }
}
