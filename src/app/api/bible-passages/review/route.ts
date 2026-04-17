import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BiblePassage from "@/models/BiblePassage";
import { reviewPassage } from "@/lib/bible-scanner";

/**
 * POST /api/bible-passages/review
 * Trigger Gemini review batch for unreviewed passages.
 * Body (optional): { passageIds?: string[], limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json().catch(() => ({}));
    const { passageIds, limit: batchLimit } = body as {
      passageIds?: string[];
      limit?: number;
    };

    let ids: string[];

    if (passageIds && passageIds.length > 0) {
      ids = passageIds;
    } else {
      // Find unreviewed passages
      const maxReview = Math.min(batchLimit ?? 20, 50);
      const pending = await BiblePassage.find({ reviewStatus: "pending" })
        .select("_id")
        .limit(maxReview)
        .lean();
      ids = pending.map((p) => p._id.toString());
    }

    if (ids.length === 0) {
      return NextResponse.json({ message: "No passages to review", reviewed: 0 });
    }

    // Run reviews in background
    const results = { total: ids.length, success: 0, failed: 0, errors: [] as string[] };

    // Process sequentially to respect rate limits
    const reviewPromise = (async () => {
      for (const id of ids) {
        try {
          await reviewPassage(id);
          results.success++;
        } catch (error) {
          results.failed++;
          const message = error instanceof Error ? error.message : String(error);
          results.errors.push(`${id}: ${message}`);
        }
      }
    })();

    // Don't await — return immediately
    reviewPromise.catch((err) => {
      console.error("Review batch failed:", err);
    });

    return NextResponse.json(
      {
        message: `Review started for ${ids.length} passages`,
        total: ids.length,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/bible-passages/review error:", error);
    return NextResponse.json(
      { error: "Failed to start review batch" },
      { status: 500 }
    );
  }
}
