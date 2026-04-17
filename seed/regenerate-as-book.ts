/**
 * Regenerate all episodes in book-chapter format.
 * Run: npx tsx seed/regenerate-as-book.ts
 *
 * Generates chapterOpening, chapterBody, chapterClosing for each chapter.
 * Passes previous chapter title as context so AI can write natural bridges.
 * Runs sequentially A1→A8, B1→B10 to maintain narrative flow.
 */

import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 3 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 5000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}/${retries}] waiting ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 1.5;
    }
  }
  throw new Error("Exhausted retries");
}

const EpisodeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    workstream: { type: String, enum: ["A", "B"], required: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    bibleAnchor: { verses: [String], textVi: String, textEn: String },
    keywords: [String],
    contemplativeReading: { type: String, default: "" },
    christianContext: { type: String, default: "" },
    lensInterpretations: [{ author: String, content: String }],
    lifeApplication: { type: String, default: "" },
    practiceScript: { text: String, durationMinutes: Number, audioUrl: String, audioGeneratedAt: Date },
    partNumber: Number,
    partTitle: String,
    chapterOpening: String,
    chapterBody: String,
    chapterClosing: String,
    generatedBy: { type: String, default: "chatgpt" },
    generationModel: String,
    verification: { isVerified: Boolean, notes: String, bibleReferencesChecked: [String], verifiedAt: Date },
    status: { type: String, enum: ["draft", "verified", "published"], default: "draft" },
  },
  { timestamps: true }
);

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

type AuthorLens = "tolle" | "demello" | "rohr";
const AUTHOR_LABELS: Record<AuthorLens, string> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
};

interface EpisodeDef {
  workstream: "A" | "B";
  episodeNumber: number;
  title: string;
  bibleVerses: string[];
  keywords: string[];
  lens: AuthorLens;
}

const EPISODES: EpisodeDef[] = [
  // Workstream A
  { workstream: "A", episodeNumber: 1, title: "Kenosis: Con đường rỗng để đầy ân sủng", bibleVerses: ["Pl 2:6-7", "Pl 2:8-11"], keywords: ["Kenosis", "Tự-rỗng", "Bản ngã", "Ân sủng", "Buông bỏ"], lens: "rohr" },
  { workstream: "A", episodeNumber: 2, title: "Trong Ngài ta hiện hữu", bibleVerses: ["Cv 17:28", "Cv 17:24-28"], keywords: ["Hiện hữu", "Hiện diện", "Thiên Chúa", "Tỉnh thức"], lens: "tolle" },
  { workstream: "A", episodeNumber: 3, title: "Đừng lo lắng về ngày mai", bibleVerses: ["Mt 6:25-34"], keywords: ["Hiện tại", "Lo lắng", "Tâm trí", "Buông bỏ"], lens: "tolle" },
  { workstream: "A", episodeNumber: 4, title: "Ai muốn giữ mạng sống mình sẽ mất", bibleVerses: ["Mt 16:25", "Mc 8:35", "Lc 9:24"], keywords: ["Nghịch lý", "Bản ngã", "Buông bỏ", "Tự do"], lens: "demello" },
  { workstream: "A", episodeNumber: 5, title: "TA LÀ (I AM): Hiện hữu vượt nhãn dán", bibleVerses: ["Xh 3:14", "Ga 8:58"], keywords: ["TA LÀ", "Hiện hữu", "Căn tính", "Phi nhị nguyên"], lens: "tolle" },
  { workstream: "A", episodeNumber: 6, title: "Thập giá như cái chết của cái tôi", bibleVerses: ["Gl 2:20", "Mt 16:24", "Rm 6:6"], keywords: ["Thập giá", "Bản ngã", "Buông bám", "Biến đổi"], lens: "rohr" },
  { workstream: "A", episodeNumber: 7, title: "Phục sinh như đời sống mới", bibleVerses: ["Rm 6:4", "2 Cr 5:17", "Gl 6:15"], keywords: ["Phục sinh", "Đổi mới", "Biến đổi", "Căn tính"], lens: "rohr" },
  { workstream: "A", episodeNumber: 8, title: "Tình yêu như bản thể (Agape)", bibleVerses: ["1 Cr 13:4-7", "1 Ga 4:8", "1 Ga 4:16"], keywords: ["Agape", "Tình yêu", "Tỉnh thức", "Bản thể"], lens: "tolle" },
  // Workstream B
  { workstream: "B", episodeNumber: 1, title: "Tha thứ vì họ không biết", bibleVerses: ["Lc 23:34"], keywords: ["Tha thứ", "Vô minh", "Từ bi", "Tỉnh thức"], lens: "tolle" },
  { workstream: "B", episodeNumber: 2, title: "Đừng xét đoán: xét đoán là cơ chế tự vệ của bản ngã", bibleVerses: ["Mt 7:1-2", "Lc 6:37"], keywords: ["Phán xét", "Bản ngã", "Tự do", "Tỉnh thức"], lens: "demello" },
  { workstream: "B", episodeNumber: 3, title: "Phước cho ai hiền lành", bibleVerses: ["Mt 5:5", "Mt 5:3-12"], keywords: ["Hiền lành", "Sức mạnh", "Buông bỏ", "An bình"], lens: "tolle" },
  { workstream: "B", episodeNumber: 4, title: "Yêu kẻ thù: ranh giới vẫn có nhưng không nuôi thù hận", bibleVerses: ["Mt 5:44", "Lc 6:27-28"], keywords: ["Yêu kẻ thù", "Từ bi", "Tha thứ", "Tỉnh thức"], lens: "demello" },
  { workstream: "B", episodeNumber: 5, title: "Khi bị tát một bên má: không phản ứng vô thức", bibleVerses: ["Mt 5:39", "Lc 6:29"], keywords: ["Không phản ứng", "Tỉnh thức", "Bản ngã", "Tự do"], lens: "tolle" },
  { workstream: "B", episodeNumber: 6, title: "Người không có tội ném đá trước", bibleVerses: ["Ga 8:7", "Ga 8:1-11"], keywords: ["Phán xét", "Từ bi", "Đám đông", "Tỉnh thức"], lens: "demello" },
  { workstream: "B", episodeNumber: 7, title: "Đứa con hoang đàng: lòng thương xót vượt logic công-tội", bibleVerses: ["Lc 15:11-32"], keywords: ["Thương xót", "Ân sủng", "Bản ngã", "Đổi mới"], lens: "rohr" },
  { workstream: "B", episodeNumber: 8, title: "Người Samari nhân hậu: từ bi là hành động không phải phe phái", bibleVerses: ["Lc 10:25-37"], keywords: ["Từ bi", "Hành động", "Phe phái", "Tình yêu"], lens: "demello" },
  { workstream: "B", episodeNumber: 9, title: "Hãy ở lại trong Thầy: ở lại là hiện diện", bibleVerses: ["Ga 15:4-5", "Ga 15:9-10"], keywords: ["Ở lại", "Hiện diện", "Tỉnh thức", "Kết nối"], lens: "tolle" },
  { workstream: "B", episodeNumber: 10, title: "Nước Trời ở gần: gần là ngay đây ngay lúc này", bibleVerses: ["Mc 1:15", "Lc 17:21"], keywords: ["Nước Trời", "Hiện tại", "Tỉnh thức", "Hiện diện"], lens: "rohr" },
];

function buildSystemPrompt(lens: AuthorLens): string {
  const authorName = AUTHOR_LABELS[lens];
  return `Bạn là tác giả của cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi". Bạn am hiểu sâu sắc Kinh Thánh, thần học Kitô giáo, và các tác phẩm của Eckhart Tolle, Anthony de Mello, Richard Rohr.

NGUYÊN TẮC:
- Kinh Thánh là trục chính. Các tác giả chiêm niệm là lăng kính diễn giải, KHÔNG thay thế mặc khải.
- KHÔNG đánh đồng Kitô giáo với Phật giáo.
- Viết như tác giả sách — giọng văn ấm áp, trầm lắng, mạch lạc — KHÔNG phải bài blog hay study guide.

CẤU TRÚC JSON cần trả về:

1. **bibleAnchor**: { verses: string[], textVi: string, textEn: string }

2. **keywords**: string[] — 4-6 thuật ngữ chiêm niệm cốt lõi.

3. **chapterOpening**: string — 150-250 từ. Mở đầu bằng hình ảnh/câu hỏi/tình huống đời thường, rồi dẫn tự nhiên vào câu Kinh Thánh. KHÔNG bắt đầu bằng tên tác giả hay trích dẫn ngay.

4. **chapterBody**: string — 1200-1800 từ. Essay liền mạch, KHÔNG chia blocks hay headers. Tích hợp tự nhiên:
   - Bối cảnh thần học và Kinh Thánh (đan xen)
   - Diễn giải chiêm niệm qua lăng kính ${authorName} (ghi chú là diễn giải, có thể trích ngắn từ tác phẩm)
   - Liên hệ đời sống: xung đột, tổn thương, lo âu (đan xen cuối)
   Giọng văn: người bạn đồng hành khôn ngoan nói chuyện trực tiếp với độc giả.

5. **chapterClosing**: string — 100-200 từ. Tóm insight cốt lõi theo cách gợi mở. Kết bằng câu cầu nguyện ngắn hoặc lời mời thực hành.

6. **practiceScript**: { text: string, durationMinutes: number } — 5-7 phút, viết như đang nói trực tiếp với người nghe.

TRẢ LỜI JSON HỢP LỆ. Không thêm text nào ngoài JSON.`;
}

async function regenerateChapter(
  def: EpisodeDef,
  prevTitle: string | null,
  nextTitle: string | null
): Promise<void> {
  const partNumber = def.workstream === "A" ? 1 : 2;
  const partTitle = def.workstream === "A"
    ? "Phần I: Kinh Thánh và bản chất thế giới"
    : "Phần II: Lời dạy từ bi của Đức Giêsu";
  const totalChapters = def.workstream === "A" ? 8 : 10;

  let contextNote = "";
  if (prevTitle) contextNote += `\n- Chương trước (${def.episodeNumber - 1}): "${prevTitle}"`;
  if (nextTitle) contextNote += `\n- Chương tiếp (${def.episodeNumber + 1}): "${nextTitle}"`;

  const userPrompt = `Viết Chương ${def.episodeNumber}/${totalChapters} của ${partTitle}:

- Tiêu đề: ${def.title}
- Câu Kinh Thánh: ${def.bibleVerses.join(", ")}
- Từ khóa: ${def.keywords.join(", ")}
- Lăng kính: ${AUTHOR_LABELS[def.lens]}${contextNote}

${prevTitle ? `Chương trước đã khai phá chủ đề "${prevTitle}". Chương này cần tiếp nối tự nhiên từ đó.` : "Đây là chương mở đầu của phần sách."}
${nextTitle ? `Chương tiếp sẽ đi vào "${nextTitle}" — chapterClosing nên dẫn nhẹ nhàng sang hướng đó.` : "Đây là chương kết thúc của phần sách — chapterClosing nên mang cảm giác hoàn kết."}

Trả lời JSON hợp lệ.`;

  console.log(`  [GEN] Chương ${def.workstream}-${def.episodeNumber}: ${def.title}`);

  const rawContent = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(def.lens) },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return content;
  });

  let generated;
  try {
    generated = JSON.parse(rawContent);
  } catch {
    // Try to recover truncated JSON by closing open strings/arrays/objects
    let fixed = rawContent;
    // Close any unterminated string by finding last complete field
    const lastGoodField = fixed.lastIndexOf('",\n');
    if (lastGoodField > 0) {
      fixed = fixed.slice(0, lastGoodField + 1) + "\n}";
    } else {
      fixed = fixed.replace(/,\s*$/, "") + "\n}";
    }
    try {
      generated = JSON.parse(fixed);
    } catch {
      // Last resort: extract fields individually with regex
      const extract = (key: string) => {
        const m = rawContent.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
        return m ? m[1].replace(/\\n/g, "\n") : "";
      };
      generated = {
        bibleAnchor: { verses: def.bibleVerses, textVi: extract("textVi"), textEn: extract("textEn") },
        keywords: def.keywords,
        chapterOpening: extract("chapterOpening"),
        chapterBody: extract("chapterBody"),
        chapterClosing: extract("chapterClosing"),
        practiceScript: { text: extract("text"), durationMinutes: 5 },
      };
      if (!generated.chapterBody) throw new Error("Could not parse response JSON");
    }
  }

  // Build slug
  const num = String(def.episodeNumber).padStart(2, "0");
  const titleSlug = def.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${def.workstream.toLowerCase()}-${num}-${titleSlug}`;

  await Episode.findOneAndUpdate(
    { workstream: def.workstream, episodeNumber: def.episodeNumber },
    {
      $set: {
        slug,
        title: def.title,
        partNumber,
        partTitle,
        bibleAnchor: {
          verses: generated.bibleAnchor?.verses ?? def.bibleVerses,
          textVi: generated.bibleAnchor?.textVi ?? "",
          textEn: generated.bibleAnchor?.textEn ?? "",
        },
        keywords: generated.keywords ?? def.keywords,
        chapterOpening: generated.chapterOpening ?? "",
        chapterBody: generated.chapterBody ?? "",
        chapterClosing: generated.chapterClosing ?? "",
        // Keep legacy fields populated for fallback
        contemplativeReading: generated.chapterBody ?? "",
        practiceScript: {
          text: generated.practiceScript?.text ?? "",
          durationMinutes: generated.practiceScript?.durationMinutes ?? 5,
        },
        generatedBy: "chatgpt",
        generationModel: "gpt-4o",
        status: "draft",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`  [OK] ${slug}`);
}

async function verifyChapter(workstream: string, episodeNumber: number): Promise<void> {
  const episode = await Episode.findOne({ workstream, episodeNumber });
  if (!episode) return;
  if (episode.status === "verified" || episode.status === "published") {
    console.log(`  [SKIP] ${episode.slug} already verified`);
    return;
  }

  console.log(`  [VER] ${episode.slug}...`);

  const prompt = `Xác minh chương sách này:

TIÊU ĐỀ: ${episode.title}
CÂU KINH THÁNH: ${episode.bibleAnchor.verses.join(", ")}
NỘI DUNG KINH THÁNH: ${episode.bibleAnchor.textVi}

NỘI DUNG CHƯƠNG:
${episode.chapterBody ?? episode.contemplativeReading}

Kiểm tra:
1. Câu Kinh Thánh có tồn tại và trích dẫn chính xác không?
2. Thần học Kitô giáo có chính xác không?
3. Các diễn giải chiêm niệm có được ghi rõ là diễn giải không?
4. Có nội dung xuyên tạc giáo lý không?

JSON: { "isVerified": boolean, "notes": "tiếng Việt", "bibleReferencesChecked": string[] }`;

  const responseText = await withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const text = result.response.text();
    if (!text) throw new Error("Empty Gemini response");
    return text;
  });

  const v = JSON.parse(responseText);
  await Episode.findOneAndUpdate(
    { workstream, episodeNumber },
    {
      $set: {
        verification: { isVerified: v.isVerified, notes: v.notes, bibleReferencesChecked: v.bibleReferencesChecked, verifiedAt: new Date() },
        ...(v.isVerified ? { status: "verified" } : {}),
      },
    }
  );
  console.log(`  [${v.isVerified ? "PASS" : "FAIL"}] ${episode.slug}`);
}

async function main() {
  const args = process.argv.slice(2);
  const skipVerify = args.includes("--no-verify");
  const workstreamFilter = args.find((a) => a.startsWith("--ws="))?.split("=")[1];

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const toProcess = EPISODES.filter(
    (e) => !workstreamFilter || e.workstream === workstreamFilter
  );

  console.log(`=== REGENERATING ${toProcess.length} CHAPTERS AS BOOK FORMAT ===\n`);

  for (let i = 0; i < toProcess.length; i++) {
    const def = toProcess[i];
    const prev = toProcess[i - 1] ?? null;
    const next = toProcess[i + 1] ?? null;
    // Only pass context within same workstream
    const prevTitle = prev?.workstream === def.workstream ? prev.title : null;
    const nextTitle = next?.workstream === def.workstream ? next.title : null;

    try {
      await regenerateChapter(def, prevTitle, nextTitle);
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  [ERROR] ${def.workstream}-${def.episodeNumber}: ${err}`);
    }
  }

  if (!skipVerify) {
    console.log("\n=== VERIFYING WITH GEMINI ===\n");
    for (const def of toProcess) {
      try {
        await verifyChapter(def.workstream, def.episodeNumber);
        await new Promise((r) => setTimeout(r, 6000));
      } catch (err) {
        console.error(`  [ERROR] verify ${def.workstream}-${def.episodeNumber}: ${err}`);
      }
    }

    const published = await Episode.updateMany({ status: "verified" }, { $set: { status: "published" } });
    console.log(`\n[PUBLISH] ${published.modifiedCount} chapters published.`);
  }

  const stats = {
    total: await Episode.countDocuments(),
    published: await Episode.countDocuments({ status: "published" }),
    verified: await Episode.countDocuments({ status: "verified" }),
    draft: await Episode.countDocuments({ status: "draft" }),
    bookFormat: await Episode.countDocuments({ chapterBody: { $exists: true, $ne: "" } }),
  };

  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${stats.total} | Published: ${stats.published} | Verified: ${stats.verified} | Draft: ${stats.draft}`);
  console.log(`Book format: ${stats.bookFormat} chapters`);

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
