/**
 * Expand existing 18 chapters (A1-A8, B1-B10) with full-length content.
 * Run: npx tsx seed/expand-chapters.ts [--ws=A|B] [--no-verify]
 *
 * Changes vs original:
 * - max_tokens: 16384 (restored from 4096/6000)
 * - chapterBody: 2000-2800 words (was 900-1100)
 * - chapterOpening: 250-350 words
 * - chapterClosing: 200-280 words
 * - theologicalNote: 150-200 words (new field)
 * - practiceScript: 500-700 words
 * - Two author lenses per chapter
 */

import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 180_000, maxRetries: 2 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------------------------------------------------------------------------
// Schema (inline to avoid path issues)
// ---------------------------------------------------------------------------

const EpisodeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    workstream: { type: String, enum: ["A", "B", "C", "D", "E"], required: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    bibleAnchor: { verses: [String], textVi: String, textEn: String },
    keywords: [String],
    contemplativeReading: { type: String, default: "" },
    christianContext: { type: String, default: "" },
    lensInterpretations: [{ author: String, content: String }],
    lifeApplication: { type: String, default: "" },
    partNumber: Number,
    partTitle: String,
    chapterOpening: String,
    chapterBody: String,
    chapterClosing: String,
    theologicalNote: String,
    practiceScript: { text: String, durationMinutes: Number },
    generatedBy: { type: String, default: "chatgpt" },
    generationModel: String,
    verification: { isVerified: Boolean, notes: String, bibleReferencesChecked: [String], verifiedAt: Date },
    status: { type: String, enum: ["draft", "verified", "published"], default: "draft" },
  },
  { timestamps: true }
);

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

// ---------------------------------------------------------------------------
// Episode definitions
// ---------------------------------------------------------------------------

type AuthorLens = "tolle" | "demello" | "rohr";

interface EpisodeDef {
  workstream: "A" | "B";
  episodeNumber: number;
  title: string;
  bibleVerses: string[];
  keywords: string[];
  primaryLens: AuthorLens;
  secondaryLens: AuthorLens;
}

const AUTHOR_LABELS: Record<AuthorLens, string> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
};

const EPISODES: EpisodeDef[] = [
  // Workstream A
  { workstream: "A", episodeNumber: 1, title: "Kenosis: Con đường rỗng để đầy ân sủng", bibleVerses: ["Pl 2:6-7", "Pl 2:8-11"], keywords: ["Kenosis", "Tự-rỗng", "Bản ngã", "Ân sủng", "Buông bỏ"], primaryLens: "rohr", secondaryLens: "tolle" },
  { workstream: "A", episodeNumber: 2, title: "Trong Ngài ta hiện hữu", bibleVerses: ["Cv 17:28", "Cv 17:24-28"], keywords: ["Hiện hữu", "Hiện diện", "Thiên Chúa", "Tỉnh thức"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "A", episodeNumber: 3, title: "Đừng lo lắng về ngày mai", bibleVerses: ["Mt 6:25-34"], keywords: ["Hiện tại", "Lo lắng", "Tâm trí", "Buông bỏ"], primaryLens: "tolle", secondaryLens: "demello" },
  { workstream: "A", episodeNumber: 4, title: "Ai muốn giữ mạng sống mình sẽ mất", bibleVerses: ["Mt 16:25", "Mc 8:35", "Lc 9:24"], keywords: ["Nghịch lý", "Bản ngã", "Buông bỏ", "Tự do"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "A", episodeNumber: 5, title: "TA LÀ (I AM): Hiện hữu vượt nhãn dán", bibleVerses: ["Xh 3:14", "Ga 8:58"], keywords: ["TA LÀ", "Hiện hữu", "Căn tính", "Phi nhị nguyên"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "A", episodeNumber: 6, title: "Thập giá như cái chết của cái tôi", bibleVerses: ["Gl 2:20", "Mt 16:24", "Rm 6:6"], keywords: ["Thập giá", "Bản ngã", "Buông bám", "Biến đổi"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "A", episodeNumber: 7, title: "Phục sinh như đời sống mới", bibleVerses: ["Rm 6:4", "2 Cr 5:17", "Gl 6:15"], keywords: ["Phục sinh", "Đổi mới", "Biến đổi", "Căn tính"], primaryLens: "rohr", secondaryLens: "tolle" },
  { workstream: "A", episodeNumber: 8, title: "Tình yêu Agape như bản thể", bibleVerses: ["1 Cr 13:4-7", "1 Ga 4:8", "1 Ga 4:16"], keywords: ["Agape", "Tình yêu", "Tỉnh thức", "Bản thể"], primaryLens: "tolle", secondaryLens: "rohr" },
  // Workstream B
  { workstream: "B", episodeNumber: 1, title: "Tha thứ vì họ không biết", bibleVerses: ["Lc 23:34"], keywords: ["Tha thứ", "Vô minh", "Từ bi", "Tỉnh thức"], primaryLens: "tolle", secondaryLens: "demello" },
  { workstream: "B", episodeNumber: 2, title: "Đừng xét đoán: xét đoán là cơ chế tự vệ của bản ngã", bibleVerses: ["Mt 7:1-2", "Lc 6:37"], keywords: ["Phán xét", "Bản ngã", "Tự do", "Tỉnh thức"], primaryLens: "demello", secondaryLens: "tolle" },
  { workstream: "B", episodeNumber: 3, title: "Phước cho ai hiền lành", bibleVerses: ["Mt 5:5", "Mt 5:3-12"], keywords: ["Hiền lành", "Sức mạnh", "Buông bỏ", "An bình"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "B", episodeNumber: 4, title: "Yêu kẻ thù: ranh giới vẫn có nhưng không nuôi thù hận", bibleVerses: ["Mt 5:44", "Lc 6:27-28"], keywords: ["Yêu kẻ thù", "Từ bi", "Tha thứ", "Tỉnh thức"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "B", episodeNumber: 5, title: "Khi bị tát một bên má: không phản ứng vô thức", bibleVerses: ["Mt 5:39", "Lc 6:29"], keywords: ["Không phản ứng", "Tỉnh thức", "Bản ngã", "Tự do"], primaryLens: "tolle", secondaryLens: "demello" },
  { workstream: "B", episodeNumber: 6, title: "Người không có tội ném đá trước", bibleVerses: ["Ga 8:7", "Ga 8:1-11"], keywords: ["Phán xét", "Từ bi", "Đám đông", "Tỉnh thức"], primaryLens: "demello", secondaryLens: "tolle" },
  { workstream: "B", episodeNumber: 7, title: "Đứa con hoang đàng: lòng thương xót vượt logic công-tội", bibleVerses: ["Lc 15:11-32"], keywords: ["Thương xót", "Ân sủng", "Bản ngã", "Đổi mới"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "B", episodeNumber: 8, title: "Người Samari nhân hậu: từ bi là hành động không phải phe phái", bibleVerses: ["Lc 10:25-37"], keywords: ["Từ bi", "Hành động", "Phe phái", "Tình yêu"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "B", episodeNumber: 9, title: "Hãy ở lại trong Thầy: ở lại là hiện diện", bibleVerses: ["Ga 15:4-5", "Ga 15:9-10"], keywords: ["Ở lại", "Hiện diện", "Tỉnh thức", "Kết nối"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "B", episodeNumber: 10, title: "Nước Trời ở gần: gần là ngay đây ngay lúc này", bibleVerses: ["Mc 1:15", "Lc 17:21"], keywords: ["Nước Trời", "Hiện tại", "Tỉnh thức", "Hiện diện"], primaryLens: "rohr", secondaryLens: "tolle" },
];

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 6000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}/${retries}] waiting ${delayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 1.5;
    }
  }
  throw new Error("Exhausted retries");
}

// ---------------------------------------------------------------------------
// System prompt — expanded content
// ---------------------------------------------------------------------------

function buildSystemPrompt(primaryLens: AuthorLens, secondaryLens: AuthorLens): string {
  const primary = AUTHOR_LABELS[primaryLens];
  const secondary = AUTHOR_LABELS[secondaryLens];

  return `Bạn là tác giả của cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi". Bạn am hiểu sâu sắc Kinh Thánh, thần học Kitô giáo, và các tác phẩm của Eckhart Tolle, Anthony de Mello, Richard Rohr.

NGUYÊN TẮC:
- Kinh Thánh là trục chính. Tác giả chiêm niệm là lăng kính diễn giải, KHÔNG thay thế mặc khải.
- KHÔNG đánh đồng Kitô giáo với Phật giáo.
- Viết như tác giả sách — giọng văn ấm áp, trầm lắng, mạch lạc — KHÔNG phải bài blog hay study guide.

TRẢ VỀ JSON với các fields sau:

1. **bibleAnchor**: { verses: string[], textVi: string, textEn: string }

2. **keywords**: string[] — 4-6 thuật ngữ chiêm niệm cốt lõi.

3. **theologicalNote**: string — 150-200 từ. Bối cảnh lịch sử và thần học ngắn gọn của đoạn Kinh Thánh: hoàn cảnh tác giả, bối cảnh văn hóa thời đó, ý nghĩa trong thần học Kitô giáo truyền thống. Viết như một chú thích học thuật nhẹ nhàng.

4. **chapterOpening**: string — 250-350 từ. Mở đầu bằng hình ảnh/câu hỏi/tình huống đời thường, dẫn tự nhiên vào câu Kinh Thánh. KHÔNG bắt đầu bằng tên tác giả.

5. **chapterBody**: string — 2000-2800 từ. Essay liền mạch, KHÔNG chia blocks hay headers. Tích hợp:
   - Bối cảnh lịch sử/văn hóa của câu Kinh Thánh (đan xen)
   - Diễn giải chiêm niệm qua lăng kính chính: ${primary} (ghi chú là diễn giải)
   - Diễn giải bổ sung qua lăng kính phụ: ${secondary} (ghi chú rõ)
   - Câu chuyện minh họa cụ thể từ đời sống (xung đột, tổn thương, gia đình, công việc)
   Giọng văn: người bạn đồng hành khôn ngoan nói chuyện trực tiếp.

6. **chapterClosing**: string — 200-280 từ. Tóm insight cốt lõi theo cách gợi mở. Dẫn nhẹ sang chương tiếp (nếu có). Kết bằng câu cầu nguyện ngắn.

7. **practiceScript**: { text: string, durationMinutes: number } — 7-10 phút, viết như đang nói trực tiếp. Gồm: mở đầu (hít thở), phần chính (hướng dẫn từng bước), kết thúc (quay lại hiện tại).

TRẢ LỜI JSON HỢP LỆ. Không thêm text nào ngoài JSON.`;
}

// ---------------------------------------------------------------------------
// Generate one chapter
// ---------------------------------------------------------------------------

async function expandChapter(def: EpisodeDef, prevTitle: string | null, nextTitle: string | null): Promise<void> {
  const partNumber = def.workstream === "A" ? 1 : 2;
  const partTitle = def.workstream === "A"
    ? "Phần I: Kinh Thánh và bản chất thế giới"
    : "Phần II: Lời dạy từ bi của Đức Giêsu";
  const totalChapters = def.workstream === "A" ? 9 : 11;

  let contextNote = "";
  if (prevTitle) contextNote += `\n- Chương trước: "${prevTitle}"`;
  if (nextTitle) contextNote += `\n- Chương tiếp: "${nextTitle}"`;

  const userPrompt = `Viết Chương ${def.episodeNumber}/${totalChapters} của ${partTitle}:

Tiêu đề: ${def.title}
Câu Kinh Thánh: ${def.bibleVerses.join(", ")}
Từ khóa: ${def.keywords.join(", ")}
Lăng kính chính: ${AUTHOR_LABELS[def.primaryLens]}
Lăng kính phụ: ${AUTHOR_LABELS[def.secondaryLens]}${contextNote}

${prevTitle ? `Chương trước đã khai phá "${prevTitle}". Chương này tiếp nối tự nhiên từ đó.` : "Đây là chương mở đầu của phần sách."}
${nextTitle ? `Chương tiếp sẽ đi vào "${nextTitle}" — chapterClosing nên dẫn nhẹ sang hướng đó.` : "Đây là chương kết — chapterClosing mang cảm giác hoàn kết."}

Yêu cầu đặc biệt cho chapterBody: viết đủ 2000-2800 từ, bao gồm bối cảnh lịch sử/văn hóa của đoạn Kinh Thánh và cả hai lăng kính.

Trả lời JSON hợp lệ.`;

  console.log(`  [GEN] ${def.workstream}${def.episodeNumber}: ${def.title}`);

  const rawContent = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(def.primaryLens, def.secondaryLens) },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return content;
  });

  const generated = JSON.parse(rawContent);

  const num = String(def.episodeNumber).padStart(2, "0");
  const titleSlug = def.title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
        theologicalNote: generated.theologicalNote ?? "",
        chapterOpening: generated.chapterOpening ?? "",
        chapterBody: generated.chapterBody ?? "",
        chapterClosing: generated.chapterClosing ?? "",
        contemplativeReading: generated.chapterBody ?? "",
        practiceScript: {
          text: generated.practiceScript?.text ?? "",
          durationMinutes: generated.practiceScript?.durationMinutes ?? 7,
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

// ---------------------------------------------------------------------------
// Verify with Gemini
// ---------------------------------------------------------------------------

async function verifyChapter(workstream: string, episodeNumber: number): Promise<void> {
  const episode = await Episode.findOne({ workstream, episodeNumber });
  if (!episode) return;
  if (episode.status === "verified" || episode.status === "published") {
    console.log(`  [SKIP] ${episode.slug} already verified`);
    return;
  }

  const prompt = `Xác minh chương sách Kitô giáo chiêm niệm:

TIÊU ĐỀ: ${episode.title}
CÂU KINH THÁNH: ${episode.bibleAnchor.verses.join(", ")}
NỘI DUNG: ${(episode.chapterBody ?? episode.contemplativeReading).slice(0, 3000)}

Kiểm tra:
1. Câu Kinh Thánh có tồn tại và trích dẫn chính xác không?
2. Thần học Kitô giáo có chính xác không?
3. Các diễn giải chiêm niệm có được ghi rõ là diễn giải không?
4. Có nội dung xuyên tạc giáo lý không?

JSON: { "isVerified": boolean, "notes": "tiếng Việt", "bibleReferencesChecked": string[] }`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await withRetry(async () => {
    const r = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return r;
  });

  const v = JSON.parse(result.response.text());
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const skipVerify = args.includes("--no-verify");
  const wsFilter = args.find(a => a.startsWith("--ws="))?.split("=")[1];

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const toProcess = EPISODES.filter(e => !wsFilter || e.workstream === wsFilter);
  console.log(`=== EXPANDING ${toProcess.length} CHAPTERS ===\n`);

  for (let i = 0; i < toProcess.length; i++) {
    const def = toProcess[i];
    const prev = toProcess[i - 1];
    const next = toProcess[i + 1];
    const prevTitle = prev?.workstream === def.workstream ? prev.title : null;
    const nextTitle = next?.workstream === def.workstream ? next.title : null;

    try {
      await expandChapter(def, prevTitle, nextTitle);
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  [ERROR] ${def.workstream}${def.episodeNumber}: ${err}`);
    }
  }

  if (!skipVerify) {
    console.log("\n=== VERIFYING WITH GEMINI ===\n");
    for (const def of toProcess) {
      try {
        await verifyChapter(def.workstream, def.episodeNumber);
        await new Promise(r => setTimeout(r, 4000));
      } catch (err) {
        console.error(`  [ERROR] verify ${def.workstream}${def.episodeNumber}: ${err}`);
      }
    }

    await Episode.updateMany({ status: "verified" }, { $set: { status: "published" } });
    console.log("\n[PUBLISH] All verified chapters published.");
  }

  const stats = {
    total: await Episode.countDocuments(),
    published: await Episode.countDocuments({ status: "published" }),
    draft: await Episode.countDocuments({ status: "draft" }),
  };
  console.log(`\nDone. Total: ${stats.total} | Published: ${stats.published} | Draft: ${stats.draft}`);

  await mongoose.disconnect();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
