import openai from "./openai";
import { getGeminiModel } from "./gemini";
import { geminiLimiter, openaiLimiter } from "./rate-limiter";
import { dbConnect } from "./mongodb";
import BiblePassage from "@/models/BiblePassage";
import ScanJob from "@/models/ScanJob";
import { findBook } from "./bible-reference";
import type { BiblePassageData, Classification, ContemplativePerspective } from "@/types/bible-passage";
import type { ScanPhase } from "@/types/scan-job";

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const CLASSIFY_SYSTEM_PROMPT = `Bạn là chuyên gia về Kitô giáo chiêm niệm (contemplative Christianity), am hiểu sâu sắc thần học, Kinh Thánh và truyền thống chiêm niệm.

NHIỆM VỤ: Phân loại đoạn Kinh Thánh theo 3 quan điểm triết học và viết góc nhìn chiêm niệm.

3 LOẠI PHÂN LOẠI:
1. **theGioiQuan** (Thế giới quan): Cách nhìn về bản chất thế giới, thực tại, Thiên Chúa và vũ trụ. VD: sáng tạo, sự hiện diện của Thiên Chúa, bản chất vô thường.
2. **nhanSinhQuan** (Nhân sinh quan): Cách nhìn về con người, ý nghĩa cuộc sống, đau khổ, tự do. VD: bản chất con người, tội lỗi, cứu chuộc, ý nghĩa đau khổ.
3. **giaTriQuan** (Giá trị quan): Hệ giá trị sống, đạo đức, ưu tiên. VD: yêu thương, tha thứ, công bằng, khiêm nhường, phục vụ.

Mỗi đoạn có thể thuộc nhiều loại. Chỉ chọn loại phù hợp nhất (1-3 loại).

YÊU CẦU:
- subThemes: 2-5 chủ đề con bằng tiếng Việt
- confidence: 0.0-1.0 (mức độ phù hợp)
- contemplativePerspective: 150-300 từ tiếng Việt, góc nhìn chiêm niệm sâu sắc
- GHI RÕ đây là DIỄN GIẢI (interpretation), KHÔNG PHẢI giáo lý (doctrine)

TRẢ LỜI BẰNG JSON HỢP LỆ theo cấu trúc:
{
  "classifications": [
    { "category": "theGioiQuan" | "nhanSinhQuan" | "giaTriQuan", "subThemes": ["..."], "confidence": 0.0-1.0 }
  ],
  "contemplativePerspective": {
    "text": "150-300 từ tiếng Việt...",
    "isInterpretation": true
  }
}

Chỉ trả lời JSON, không thêm text nào khác.`;

const SCAN_CHAPTER_SYSTEM_PROMPT = `Bạn là chuyên gia về Kinh Thánh và Kitô giáo chiêm niệm.

NHIỆM VỤ: Quét một loạt chương Kinh Thánh và trích xuất các đoạn văn nổi bật nhất có giá trị chiêm niệm/triết học.

Cho mỗi chương, hãy chọn 2-5 đoạn văn quan trọng nhất (passages) và cho mỗi đoạn:
1. reference (EN): VD "Matt 5:3-12"
2. referenceVi: VD "Mt 5,3-12"
3. textVi: Toàn văn tiếng Việt
4. classifications: Phân loại theo theGioiQuan / nhanSinhQuan / giaTriQuan
5. contemplativePerspective: 150-300 từ tiếng Việt (GHI RÕ là DIỄN GIẢI)

3 LOẠI PHÂN LOẠI:
- theGioiQuan: bản chất thế giới, thực tại, Thiên Chúa
- nhanSinhQuan: bản chất con người, ý nghĩa cuộc sống, đau khổ
- giaTriQuan: hệ giá trị sống, đạo đức

TRẢ LỜI BẰNG JSON:
{
  "passages": [
    {
      "reference": "Matt 5:3-12",
      "referenceVi": "Mt 5,3-12",
      "chapter": 5,
      "verseStart": 3,
      "verseEnd": 12,
      "textVi": "...",
      "classifications": [{ "category": "giaTriQuan", "subThemes": ["..."], "confidence": 0.9 }],
      "contemplativePerspective": { "text": "...", "isInterpretation": true }
    }
  ]
}

Chỉ trả lời JSON.`;

const REVIEW_SYSTEM_PROMPT = `Bạn là một chuyên gia thần học Kitô giáo và học giả Kinh Thánh.

NHIỆM VỤ: Xác minh (review) một đoạn Kinh Thánh đã được phân loại và diễn giải.

HÃY KIỂM TRA:
1. Tham chiếu Kinh Thánh có thực sự tồn tại không? (reference accurate)
2. Phân loại (theGioiQuan/nhanSinhQuan/giaTriQuan) có hợp lý không?
3. Góc nhìn chiêm niệm có được ghi rõ là DIỄN GIẢI không?
4. Có nội dung nào xuyên tạc giáo lý Kitô giáo không?

TRẢ LỜI BẰNG JSON:
{
  "isVerified": boolean,
  "referenceAccurate": boolean,
  "classificationReasonable": boolean,
  "notes": "ghi chú bằng tiếng Việt",
  "reviewedAt": "ISO date string"
}

Chỉ trả lời JSON.`;

// ---------------------------------------------------------------------------
// classifyPassage — ChatGPT
// ---------------------------------------------------------------------------

export async function classifyPassage(
  reference: string,
  referenceVi: string,
  textVi?: string
): Promise<{
  classifications: Classification[];
  contemplativePerspective: ContemplativePerspective;
}> {
  await openaiLimiter.waitForToken();

  const userPrompt = textVi
    ? `Phân loại đoạn Kinh Thánh sau:\n\nTham chiếu: ${reference} (${referenceVi})\nNội dung: ${textVi}`
    : `Phân loại đoạn Kinh Thánh: ${reference} (${referenceVi})\n\n(Hãy tự tra cứu nội dung đoạn này và phân loại)`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(rawContent);
}

// ---------------------------------------------------------------------------
// reviewPassage — Gemini
// ---------------------------------------------------------------------------

export async function reviewPassage(passageId: string) {
  await dbConnect();

  const passage = await BiblePassage.findById(passageId);
  if (!passage) {
    throw new Error(`Passage not found: ${passageId}`);
  }

  const reviewPrompt = `Xác minh đoạn Kinh Thánh sau:

THAM CHIẾU: ${passage.reference} (${passage.referenceVi})
NỘI DUNG TIẾNG VIỆT: ${passage.textVi}

PHÂN LOẠI:
${passage.classifications.map((c: Classification) => `- ${c.category}: ${c.subThemes.join(", ")} (confidence: ${c.confidence})`).join("\n")}

GÓC NHÌN CHIÊM NIỆM:
${passage.contemplativePerspective.text}`;

  await geminiLimiter.waitForToken();

  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: reviewPrompt }] }],
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: { role: "user", parts: [{ text: REVIEW_SYSTEM_PROMPT }] },
  });

  const responseText = result.response.text();
  if (!responseText) {
    throw new Error("Gemini returned an empty response");
  }

  const review = JSON.parse(responseText);

  const updatedPassage = await BiblePassage.findByIdAndUpdate(
    passageId,
    {
      $set: {
        review: {
          isVerified: review.isVerified,
          referenceAccurate: review.referenceAccurate,
          classificationReasonable: review.classificationReasonable,
          notes: review.notes,
          reviewedAt: new Date(),
        },
        reviewStatus: review.isVerified ? "verified" : "rejected",
      },
    },
    { new: true }
  );

  return updatedPassage;
}

// ---------------------------------------------------------------------------
// scanChapterBatch — ChatGPT
// ---------------------------------------------------------------------------

interface ScannedPassage {
  reference: string;
  referenceVi: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  textVi: string;
  classifications: Classification[];
  contemplativePerspective: ContemplativePerspective;
}

export async function scanChapterBatch(
  book: string,
  bookVi: string,
  startChapter: number,
  endChapter: number
): Promise<ScannedPassage[]> {
  await openaiLimiter.waitForToken();

  const chapterRange =
    startChapter === endChapter
      ? `chương ${startChapter}`
      : `chương ${startChapter} đến ${endChapter}`;

  const userPrompt = `Quét sách ${bookVi} (${book}), ${chapterRange}.

Cho mỗi chương, hãy chọn 2-5 đoạn văn quan trọng nhất có giá trị chiêm niệm/triết học và phân loại chúng.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SCAN_CHAPTER_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = JSON.parse(rawContent);
  return parsed.passages ?? [];
}

// ---------------------------------------------------------------------------
// savePassage — Upsert to DB
// ---------------------------------------------------------------------------

async function savePassage(
  data: Partial<BiblePassageData>
): Promise<string> {
  const result = await BiblePassage.findOneAndUpdate(
    { reference: data.reference },
    {
      $set: data,
      $setOnInsert: { reviewStatus: "pending" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return result._id.toString();
}

// ---------------------------------------------------------------------------
// runScanJob — Orchestrator
// ---------------------------------------------------------------------------

export async function runScanJob(jobId: string) {
  await dbConnect();

  const job = await ScanJob.findById(jobId);
  if (!job) {
    throw new Error(`ScanJob not found: ${jobId}`);
  }

  await ScanJob.findByIdAndUpdate(jobId, { $set: { status: "running" } });

  try {
    if (job.phase === "priority") {
      await runPriorityPhase(jobId);
    } else if (job.phase === "thematic" || job.phase === "systematic") {
      await runBookScanPhase(jobId, job.phase);
    }

    const finalJob = await ScanJob.findById(jobId);
    if (finalJob && finalJob.failureCount === 0) {
      await ScanJob.findByIdAndUpdate(jobId, { $set: { status: "completed" } });
    } else if (finalJob) {
      await ScanJob.findByIdAndUpdate(jobId, {
        $set: { status: finalJob.successCount > 0 ? "completed" : "failed" },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ScanJob.findByIdAndUpdate(jobId, {
      $set: { status: "failed" },
      $push: { errorMessages: message },
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Priority phase — classify specific references
// ---------------------------------------------------------------------------

async function runPriorityPhase(jobId: string) {
  const job = await ScanJob.findById(jobId);
  if (!job) return;

  // Priority phase expects references stored in description as JSON
  let references: string[];
  try {
    const meta = JSON.parse(job.description);
    references = meta.references ?? [];
  } catch {
    references = [];
  }

  await ScanJob.findByIdAndUpdate(jobId, {
    $set: { totalItems: references.length },
  });

  for (const ref of references) {
    try {
      const result = await classifyPassage(ref, ref);

      // Parse reference to extract book, chapter, verse
      const parsed = parseReference(ref);

      await savePassage({
        ...parsed,
        reference: ref,
        referenceVi: ref,
        textVi: "", // Will be filled by classify if available
        classifications: result.classifications,
        contemplativePerspective: result.contemplativePerspective,
        priorityTier: 1,
        scanPhase: "priority",
        scanBatchId: jobId,
        relatedEpisodeSlugs: [],
        generatedBy: "chatgpt",
        generationModel: "gpt-4o",
      });

      await ScanJob.findByIdAndUpdate(jobId, {
        $inc: { processedItems: 1, successCount: 1 },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ScanJob.findByIdAndUpdate(jobId, {
        $inc: { processedItems: 1, failureCount: 1 },
        $push: { errorMessages: `${ref}: ${message}` },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Book scan phase — scan chapters in batches
// ---------------------------------------------------------------------------

async function runBookScanPhase(jobId: string, phase: ScanPhase) {
  const job = await ScanJob.findById(jobId);
  if (!job) return;

  let bookAbbrs: string[];
  try {
    const meta = JSON.parse(job.description);
    bookAbbrs = meta.books ?? [];
  } catch {
    bookAbbrs = [];
  }

  const BATCH_SIZE = 3; // chapters per batch

  // Calculate total batches
  let totalBatches = 0;
  const bookInfos: { book: string; bookVi: string; chapters: number }[] = [];
  for (const abbr of bookAbbrs) {
    const bookInfo = findBook(abbr);
    if (bookInfo) {
      totalBatches += Math.ceil(bookInfo.chapters / BATCH_SIZE);
      bookInfos.push({
        book: bookInfo.abbr,
        bookVi: bookInfo.nameVi,
        chapters: bookInfo.chapters,
      });
    }
  }

  await ScanJob.findByIdAndUpdate(jobId, {
    $set: { totalItems: totalBatches },
  });

  const tier = phase === "thematic" ? 2 : 3;

  for (const info of bookInfos) {
    for (let start = 1; start <= info.chapters; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE - 1, info.chapters);

      try {
        const passages = await scanChapterBatch(
          info.book,
          info.bookVi,
          start,
          end
        );

        for (const p of passages) {
          await savePassage({
            book: info.book,
            bookVi: info.bookVi,
            chapter: p.chapter,
            verseStart: p.verseStart,
            verseEnd: p.verseEnd,
            reference: p.reference,
            referenceVi: p.referenceVi,
            textVi: p.textVi,
            classifications: p.classifications,
            contemplativePerspective: p.contemplativePerspective,
            priorityTier: tier as 1 | 2 | 3,
            scanPhase: phase,
            scanBatchId: jobId,
            relatedEpisodeSlugs: [],
            generatedBy: "chatgpt",
            generationModel: "gpt-4o",
          });
        }

        await ScanJob.findByIdAndUpdate(jobId, {
          $inc: { processedItems: 1, successCount: 1 },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await ScanJob.findByIdAndUpdate(jobId, {
          $inc: { processedItems: 1, failureCount: 1 },
          $push: {
            errors: `${info.book} ${start}-${end}: ${message}`,
          },
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseReference(ref: string): {
  book: string;
  bookVi: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
} {
  // Handles: "Mt 5,3-12", "Pl 2:7", "1Cr 13,4-8", "Ga 3,16"
  const match = ref.match(/^(\d?\s?[A-ZĐa-zàáảãạăắằẳẵặâấầẩẫậêếềểễệôốồổỗộơớờởỡợưứừửữựíìỉĩị]+)\s+(\d+)[,:](\d+)(?:-(\d+))?/);

  if (!match) {
    return { book: ref, bookVi: ref, chapter: 1, verseStart: 1 };
  }

  const bookPart = match[1].trim();
  const bookInfo = findBook(bookPart);

  return {
    book: bookInfo?.abbr ?? bookPart,
    bookVi: bookInfo?.nameVi ?? bookPart,
    chapter: parseInt(match[2], 10),
    verseStart: parseInt(match[3], 10),
    verseEnd: match[4] ? parseInt(match[4], 10) : undefined,
  };
}
