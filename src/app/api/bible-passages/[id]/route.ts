import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import BiblePassage from "@/models/BiblePassage";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/bible-passages/[id]
 * Single passage by _id or reference.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await dbConnect();
    const { id } = await context.params;

    // Try by reference first
    let passage = await BiblePassage.findOne({ reference: id }).lean();

    // Fall back to _id
    if (!passage && mongoose.Types.ObjectId.isValid(id)) {
      passage = await BiblePassage.findById(id).lean();
    }

    if (!passage) {
      return NextResponse.json(
        { error: "Passage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(passage);
  } catch (error) {
    console.error("GET /api/bible-passages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch passage" },
      { status: 500 }
    );
  }
}
