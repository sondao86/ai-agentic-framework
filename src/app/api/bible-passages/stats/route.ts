import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BiblePassage from "@/models/BiblePassage";

/**
 * GET /api/bible-passages/stats
 * Aggregated stats by category, book, review status.
 */
export async function GET() {
  try {
    await dbConnect();

    const [byCategory, byBook, byStatus, byTier, total] = await Promise.all([
      BiblePassage.aggregate([
        { $unwind: "$classifications" },
        {
          $group: {
            _id: "$classifications.category",
            count: { $sum: 1 },
            avgConfidence: { $avg: "$classifications.confidence" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      BiblePassage.aggregate([
        {
          $group: {
            _id: { book: "$book", bookVi: "$bookVi" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.book": 1 } },
      ]),

      BiblePassage.aggregate([
        {
          $group: {
            _id: "$reviewStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      BiblePassage.aggregate([
        {
          $group: {
            _id: "$priorityTier",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      BiblePassage.countDocuments(),
    ]);

    return NextResponse.json({
      total,
      byCategory: byCategory.map((c) => ({
        category: c._id,
        count: c.count,
        avgConfidence: Math.round(c.avgConfidence * 100) / 100,
      })),
      byBook: byBook.map((b) => ({
        book: b._id.book,
        bookVi: b._id.bookVi,
        count: b.count,
      })),
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      byTier: Object.fromEntries(byTier.map((t) => [t._id, t.count])),
    });
  } catch (error) {
    console.error("GET /api/bible-passages/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
