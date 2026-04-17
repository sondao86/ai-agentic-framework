import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ScanJob from "@/models/ScanJob";
import { runScanJob } from "@/lib/bible-scanner";

/**
 * POST /api/bible-passages/scan
 * Trigger a scan job.
 * Body: { phase: "priority" | "thematic" | "systematic", input: { references?: string[], books?: string[] } }
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { phase, input } = body;

    if (!phase || !["priority", "thematic", "systematic"].includes(phase)) {
      return NextResponse.json(
        { error: "Invalid phase. Must be: priority, thematic, or systematic" },
        { status: 400 }
      );
    }

    if (!input) {
      return NextResponse.json(
        { error: "Missing input field" },
        { status: 400 }
      );
    }

    // Store input in description as JSON for the job runner to parse
    const description = JSON.stringify(input);

    const totalItems =
      phase === "priority"
        ? (input.references?.length ?? 0)
        : 0; // Book scan calculates total dynamically

    const job = await ScanJob.create({
      phase,
      status: "queued",
      description,
      totalItems,
      processedItems: 0,
      successCount: 0,
      failureCount: 0,
      errorMessages: [],
    });

    // Run scan in background (non-blocking)
    runScanJob(job._id.toString()).catch((err) => {
      console.error(`ScanJob ${job._id} failed:`, err);
    });

    return NextResponse.json(
      { jobId: job._id, status: "queued", phase },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bible-passages/scan error:", error);
    return NextResponse.json(
      { error: "Failed to create scan job" },
      { status: 500 }
    );
  }
}
