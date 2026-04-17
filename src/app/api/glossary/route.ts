import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import GlossaryTerm from "@/models/GlossaryTerm";

/**
 * GET /api/glossary
 * List glossary terms.
 * Supports ?search= for MongoDB text search and ?category= for filtering.
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (
      category &&
      ["contemplative", "biblical", "mindfulness", "general"].includes(category)
    ) {
      filter.category = category;
    }

    const terms = await GlossaryTerm.find(filter)
      .sort({ termVi: 1 })
      .lean();

    return NextResponse.json(terms);
  } catch (error) {
    console.error("GET /api/glossary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch glossary terms" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glossary
 * Create a new glossary term.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const term = await GlossaryTerm.create(body);

    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    console.error("POST /api/glossary error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    // Duplicate key (e.g. termVi already exists)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === 11000
    ) {
      return NextResponse.json(
        { error: "A glossary term with this Vietnamese term already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create glossary term" },
      { status: 500 }
    );
  }
}
