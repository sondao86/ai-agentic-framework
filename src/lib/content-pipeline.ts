import openai from "./openai";
import { getGeminiModel } from "./gemini";
import { geminiLimiter, openaiLimiter } from "./rate-limiter";
import { dbConnect } from "./mongodb";
import Episode from "@/models/Episode";
import type { AuthorLens, Workstream } from "@/types/episode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenerateEpisodeParams {
  workstream: Workstream;
  episodeNumber: number;
  title: string;
  bibleVerses: string[];
  keywords: string[];
  lens: AuthorLens;
}

interface VerificationResult {
  isVerified: boolean;
  notes: string;
  bibleReferencesChecked: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSlug(workstream: Workstream, episodeNumber: number, title: string): string {
  const num = String(episodeNumber).padStart(2, "0");
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${workstream.toLowerCase()}-${num}-${titleSlug}`;
}

const AUTHOR_LABELS: Record<AuthorLens, string> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
};

// ---------------------------------------------------------------------------
// System prompt (Vietnamese)
// ---------------------------------------------------------------------------

function buildSystemPrompt(lens: AuthorLens): string {
  const authorName = AUTHOR_LABELS[lens];

  return `Bạn là tác giả của một cuốn sách chiêm niệm Kitô giáo bằng tiếng Việt, mang tên "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi". Bạn am hiểu sâu sắc Kinh Thánh, thần học Kitô giáo, và các tác phẩm của Eckhart Tolle, Anthony de Mello, Richard Rohr.

NGUYÊN TẮC CỐT LÕI:
- Kinh Thánh là trục chính. Các tác giả chiêm niệm là lăng kính diễn giải, KHÔNG thay thế mặc khải.
- KHÔNG đánh đồng Kitô giáo với Phật giáo. Chỉ đối chiếu trải nghiệm chiêm niệm khi có cơ sở.
- Viết như tác giả sách — giọng văn ấm áp, trầm lắng, mạch lạc — KHÔNG phải bài blog hay study guide.

BẠN CẦN TẠO MỘT CHƯƠNG SÁCH với cấu trúc JSON sau (tiếng Việt):

1. **bibleAnchor** (object):
   - "verses": mảng câu Kinh Thánh được cung cấp
   - "textVi": toàn văn tiếng Việt (trích từ bản dịch phổ biến)
   - "textEn": toàn văn tiếng Anh (NIV hoặc ESV)

2. **keywords** (string[]): 4-6 thuật ngữ chiêm niệm cốt lõi của chương.

3. **chapterOpening** (string): 150-250 từ. Mở đầu chương bằng một hình ảnh, câu hỏi, hoặc tình huống đời thường gần gũi — rồi dẫn tự nhiên vào câu Kinh Thánh. KHÔNG bắt đầu bằng tên tác giả hay trích dẫn ngay.

4. **chapterBody** (string): 1200-1800 từ. Bài essay liền mạch, KHÔNG chia blocks hay headers. Tích hợp tự nhiên:
   - Ý nghĩa thần học và bối cảnh Kinh Thánh (đan xen, không tách riêng)
   - Diễn giải chiêm niệm qua lăng kính ${authorName} (ghi chú rõ là diễn giải, không phải giáo lý — có thể trích ngắn từ tác phẩm của ${authorName})
   - Liên hệ với đời sống: xung đột, tổn thương, lo âu, công việc, gia đình (đan xen vào cuối)
   Giọng văn: như một người bạn đồng hành khôn ngoan đang nói chuyện trực tiếp với người đọc.

5. **chapterClosing** (string): 100-200 từ. Tóm lại một insight cốt lõi của chương theo cách gợi mở, không đóng lại quá cứng. Kết thúc bằng một câu cầu nguyện ngắn hoặc lời mời thực hành.

6. **practiceScript** (object):
   - "text": Kịch bản hướng dẫn chiêm niệm 5-7 phút, viết như đang nói trực tiếp với người nghe. Gồm: mở đầu (hít thở, chào đón), phần chính (hướng dẫn từng bước), kết thúc (quay lại hiện tại).
   - "durationMinutes": số phút (5-7)

TRẢ LỜI BẰNG JSON HỢP LỆ theo đúng cấu trúc trên. Không thêm bất kỳ text nào ngoài JSON.`;
}

// ---------------------------------------------------------------------------
// generateEpisode
// ---------------------------------------------------------------------------

export async function generateEpisode(params: GenerateEpisodeParams) {
  const { workstream, episodeNumber, title, bibleVerses, keywords, lens } = params;

  await dbConnect();

  const slug = buildSlug(workstream, episodeNumber, title);

  const partNumber = workstream === "A" ? 1 : 2;
  const partTitle = workstream === "A"
    ? "Phần I: Kinh Thánh và bản chất thế giới"
    : "Phần II: Lời dạy từ bi của Đức Giêsu";

  const userPrompt = `Hãy viết Chương ${episodeNumber} của ${partTitle}:

- Tiêu đề chương: ${title}
- Các câu Kinh Thánh: ${bibleVerses.join(", ")}
- Từ khóa gợi ý: ${keywords.join(", ")}
- Lăng kính chiêm niệm: ${AUTHOR_LABELS[lens]}

Đây là chương ${episodeNumber} trong một cuốn sách có ${workstream === "A" ? 8 : 10} chương. Viết với giọng văn liền mạch của sách, không phải bài blog.

Hãy trả lời bằng JSON hợp lệ theo đúng cấu trúc đã mô tả.`;

  // Rate-limit before calling OpenAI
  await openaiLimiter.waitForToken();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(lens) },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI returned an empty response");
  }

  const generated = JSON.parse(rawContent);

  // Build the episode document
  const episodeData = {
    slug,
    workstream,
    episodeNumber,
    title,
    bibleAnchor: {
      verses: generated.bibleAnchor?.verses ?? bibleVerses,
      textVi: generated.bibleAnchor?.textVi ?? "",
      textEn: generated.bibleAnchor?.textEn,
    },
    keywords: generated.keywords ?? keywords,
    // Book-format fields
    partNumber,
    partTitle,
    chapterOpening: generated.chapterOpening ?? "",
    chapterBody: generated.chapterBody ?? "",
    chapterClosing: generated.chapterClosing ?? "",
    // Legacy fields (kept for backward compatibility)
    contemplativeReading: generated.contemplativeReading ?? generated.chapterBody ?? "",
    christianContext: generated.christianContext ?? "",
    lensInterpretations: generated.lensInterpretations ?? [
      { author: lens, content: "" },
    ],
    lifeApplication: generated.lifeApplication ?? "",
    practiceScript: {
      text: generated.practiceScript?.text ?? "",
      durationMinutes: generated.practiceScript?.durationMinutes ?? 5,
    },
    generatedBy: "chatgpt" as const,
    generationModel: "gpt-4o",
    status: "draft" as const,
  };

  const episode = await Episode.findOneAndUpdate(
    { slug },
    { $set: episodeData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return episode;
}

// ---------------------------------------------------------------------------
// verifyEpisode
// ---------------------------------------------------------------------------

export async function verifyEpisode(episodeId: string) {
  await dbConnect();

  const episode = await Episode.findById(episodeId);
  if (!episode) {
    throw new Error(`Episode not found: ${episodeId}`);
  }

  const verificationPrompt = `Bạn là một chuyên gia thần học Kitô giáo và học giả Kinh Thánh. Hãy xác minh nội dung sau đây:

TIÊU ĐỀ: ${episode.title}

CÂU KINH THÁNH: ${episode.bibleAnchor.verses.join(", ")}
NỘI DUNG KINH THÁNH (TIẾNG VIỆT): ${episode.bibleAnchor.textVi}

BÀI ĐỌC CHIÊM NIỆM:
${episode.contemplativeReading}

BỐI CẢNH KITÔ GIÁO:
${episode.christianContext}

DIỄN GIẢI QUA LĂNG KÍNH:
${episode.lensInterpretations.map((l: { author: string; content: string }) => `[${l.author}]: ${l.content}`).join("\n\n")}

ỨNG DỤNG ĐỜI SỐNG:
${episode.lifeApplication}

KỊCH BẢN THỰC HÀNH:
${episode.practiceScript.text}

---

HÃY XÁC MINH:
1. Tất cả các câu Kinh Thánh có thực sự tồn tại và được trích dẫn chính xác không?
2. Bối cảnh thần học Kitô giáo có chính xác không?
3. Các diễn giải chiêm niệm có được ghi rõ là DIỄN GIẢI (interpretation) chứ không phải giáo lý (doctrine) không?
4. Có nội dung nào có thể bị xem là xuyên tạc giáo lý Kitô giáo không?

TRẢ LỜI BẰNG JSON HỢP LỆ với cấu trúc:
{
  "isVerified": boolean,
  "notes": "ghi chú chi tiết bằng tiếng Việt",
  "bibleReferencesChecked": ["danh sách các câu Kinh Thánh đã kiểm tra"]
}

Chỉ trả lời JSON, không thêm text nào khác.`;

  // Rate-limit before calling Gemini
  await geminiLimiter.waitForToken();

  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: verificationPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const responseText = result.response.text();
  if (!responseText) {
    throw new Error("Gemini returned an empty response");
  }

  const verification: VerificationResult = JSON.parse(responseText);

  // Update the episode with verification results
  const updatedEpisode = await Episode.findByIdAndUpdate(
    episodeId,
    {
      $set: {
        verification: {
          isVerified: verification.isVerified,
          notes: verification.notes,
          bibleReferencesChecked: verification.bibleReferencesChecked,
          verifiedAt: new Date(),
        },
        ...(verification.isVerified ? { status: "verified" } : {}),
      },
    },
    { new: true }
  );

  return updatedEpisode;
}

// ---------------------------------------------------------------------------
// generateAndVerify
// ---------------------------------------------------------------------------

export async function generateAndVerify(params: GenerateEpisodeParams) {
  const episode = await generateEpisode(params);
  const verifiedEpisode = await verifyEpisode(episode._id.toString());
  return verifiedEpisode;
}
