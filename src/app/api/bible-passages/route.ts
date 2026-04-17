import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BiblePassage from "@/models/BiblePassage";

/**
 * GET /api/bible-passages
 * List/filter passages.
 * Query params: category, book, reviewStatus, priorityTier, search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const book = searchParams.get("book");
    const reviewStatus = searchParams.get("reviewStatus");
    const priorityTier = searchParams.get("priorityTier");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (category && ["theGioiQuan", "nhanSinhQuan", "giaTriQuan"].includes(category)) {
      filter["classifications.category"] = category;
    }

    if (book) {
      filter.book = book;
    }

    if (reviewStatus && ["pending", "verified", "rejected"].includes(reviewStatus)) {
      filter.reviewStatus = reviewStatus;
    }

    if (priorityTier && ["1", "2", "3"].includes(priorityTier)) {
      filter.priorityTier = parseInt(priorityTier, 10);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [passages, total] = await Promise.all([
      BiblePassage.find(filter)
        .sort({ book: 1, chapter: 1, verseStart: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BiblePassage.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: passages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/bible-passages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch passages" },
      { status: 500 }
    );
  }
}
