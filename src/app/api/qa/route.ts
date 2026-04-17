import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import QA from "@/models/QA";
import openai from "@/lib/openai";
import { openaiLimiter } from "@/lib/rate-limiter";

export async function GET() {
  try {
    await dbConnect();

    const qaPairs = await QA.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(qaPairs);
  } catch (error) {
    console.error("GET /api/qa error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Q&A pairs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "A non-empty question string is required" },
        { status: 400 }
      );
    }

    await openaiLimiter.waitForToken();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Bạn là một chuyên gia về Kitô giáo chiêm niệm (contemplative Christianity), am hiểu sâu sắc Kinh Thánh, và quen thuộc với các tác phẩm của Eckhart Tolle, Anthony de Mello, và Richard Rohr.

Trả lời câu hỏi bằng tiếng Việt, ngắn gọn nhưng sâu sắc (200-500 từ). Luôn trích dẫn câu Kinh Thánh liên quan nếu có. Phân biệt rõ giữa giáo lý chính thức và diễn giải chiêm niệm.

Nếu câu hỏi không liên quan đến Kitô giáo hoặc tỉnh thức, hãy lịch sự cho biết phạm vi chuyên môn của bạn.`,
        },
        { role: "user", content: question.trim() },
      ],
      temperature: 0.7,
    });

    const answer =
      completion.choices[0]?.message?.content ?? "Xin lỗi, không thể tạo câu trả lời.";

    // Extract Bible references from the answer
    const versePattern = /(?:[1-3]?\s?[A-ZĐ][a-zàáảãạăắằẳẵặâấầẩẫậ]+\s+\d+[,:]\d+(?:-\d+)?)/g;
    const relatedVerses = answer.match(versePattern) ?? [];

    const qa = await QA.create({
      question: question.trim(),
      answer,
      answeredByModel: "gpt-4o",
      relatedEpisodeSlugs: [],
      relatedVerses,
      isPublished: true,
    });

    return NextResponse.json(qa, { status: 201 });
  } catch (error) {
    console.error("POST /api/qa error:", error);
    return NextResponse.json(
      { error: "Failed to create Q&A entry" },
      { status: 500 }
    );
  }
}
