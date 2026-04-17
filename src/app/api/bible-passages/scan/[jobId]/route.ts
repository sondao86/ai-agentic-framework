import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ScanJob from "@/models/ScanJob";

type RouteContext = { params: Promise<{ jobId: string }> };

/**
 * GET /api/bible-passages/scan/[jobId]
 * Check scan job progress.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await dbConnect();
    const { jobId } = await context.params;

    const job = await ScanJob.findById(jobId).lean();

    if (!job) {
      return NextResponse.json(
        { error: "Scan job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("GET /api/bible-passages/scan/[jobId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan job" },
      { status: 500 }
    );
  }
}
