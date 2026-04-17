import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import Episode from "@/models/Episode";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/episodes/[id]
 * Retrieve a single episode by slug or MongoDB _id.
 * Tries slug first, then falls back to _id.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await dbConnect();
    const { id } = await context.params;

    // Try by slug first
    let episode = await Episode.findOne({ slug: id }).lean();

    // Fall back to _id if slug didn't match and id is a valid ObjectId
    if (!episode && mongoose.Types.ObjectId.isValid(id)) {
      episode = await Episode.findById(id).lean();
    }

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error("GET /api/episodes/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch episode" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/episodes/[id]
 * Update an episode by MongoDB _id.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const body = await request.json();

    const episode = await Episode.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error("PUT /api/episodes/[id] error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update episode" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/episodes/[id]
 * Delete an episode by MongoDB _id.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const episode = await Episode.findByIdAndDelete(id).lean();

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Episode deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/episodes/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete episode" },
      { status: 500 }
    );
  }
}
