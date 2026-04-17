/**
 * Generate 21 new chapters: A9, B11, C1-C7, D1-D6, E1-E6
 * Run: npx tsx seed/generate-new-chapters.ts [--ws=A|B|C|D|E] [--no-verify]
 */

import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 180_000, maxRetries: 2 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
// Episode definitions — 21 new chapters
// ---------------------------------------------------------------------------

type AuthorLens = "tolle" | "demello" | "rohr";
type Workstream = "A" | "B" | "C" | "D" | "E";

interface EpisodeDef {
  workstream: Workstream;
  episodeNumber: number;
  title: string;
  bibleVerses: string[];
  keywords: string[];
  primaryLens: AuthorLens;
  secondaryLens: AuthorLens;
}

const PART_INFO: Record<Workstream, { number: number; title: string; total: number }> = {
  A: { number: 1, title: "Phần I: Kinh Thánh và bản chất thế giới", total: 9 },
  B: { number: 2, title: "Phần II: Lời dạy từ bi của Đức Giêsu", total: 11 },
  C: { number: 3, title: "Phần III: Hành trình nội tâm — Cầu nguyện & Tĩnh lặng", total: 7 },
  D: { number: 4, title: "Phần IV: Khổ đau, Yếu đuối & Ân sủng", total: 6 },
  E: { number: 5, title: "Phần V: Hiệp nhất, Cộng đoàn & Vũ trụ", total: 6 },
};

const AUTHOR_LABELS: Record<AuthorLens, string> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
};

const NEW_EPISODES: EpisodeDef[] = [
  // A9 — bổ sung Phần I
  { workstream: "A", episodeNumber: 9, title: "Ngôi Lời Nhập Thể: ánh sáng trong bóng tối", bibleVerses: ["Ga 1:1-5", "Ga 1:9-14"], keywords: ["Ngôi Lời", "Logos", "Nhập Thể", "Ánh sáng", "Hiện diện"], primaryLens: "rohr", secondaryLens: "tolle" },
  // B11 — bổ sung Phần II
  { workstream: "B", episodeNumber: 11, title: "Các Mối Phúc: bản đồ tỉnh thức", bibleVerses: ["Mt 5:3-12"], keywords: ["Mối Phúc", "Nghèo khó tâm hồn", "Tỉnh thức", "Biến đổi"], primaryLens: "tolle", secondaryLens: "rohr" },
  // Phần III — Cầu nguyện & Tĩnh lặng
  { workstream: "C", episodeNumber: 1, title: "Kinh Lạy Cha như thực hành hiện diện", bibleVerses: ["Mt 6:9-13", "Lc 11:2-4"], keywords: ["Kinh Lạy Cha", "Hiện diện", "Cầu nguyện", "Nước Cha trị đến"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "C", episodeNumber: 2, title: "Hãy dừng lại và nhận biết", bibleVerses: ["Tv 46:10", "Tv 46:1-3"], keywords: ["Tĩnh lặng", "Nhận biết", "Hiện diện", "Buông bỏ"], primaryLens: "demello", secondaryLens: "tolle" },
  { workstream: "C", episodeNumber: 3, title: "Lectio Divina: đọc Kinh Thánh bằng trái tim", bibleVerses: ["Tv 1:2", "Tv 119:105", "Gs 1:8"], keywords: ["Lectio Divina", "Chiêm niệm", "Lắng nghe", "Lời Chúa"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "C", episodeNumber: 4, title: "Đêm tối tâm hồn: hành trình qua trống rỗng", bibleVerses: ["Tv 88:1-9", "Tv 22:1-2", "Mc 15:34"], keywords: ["Đêm tối", "Trống rỗng", "Thiên Chúa ẩn mình", "Biến đổi"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "C", episodeNumber: 5, title: "Cầu nguyện bằng thinh lặng", bibleVerses: ["1 V 19:11-13", "Kh 8:1"], keywords: ["Thinh lặng", "Centering Prayer", "Tiếng gió hiu hiu", "Hiện diện"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "C", episodeNumber: 6, title: "Giảng Viên: vô thường như thầy dạy", bibleVerses: ["Gv 1:2", "Gv 3:1-8", "Gv 12:13"], keywords: ["Vô thường", "Phù vân", "Hiện tại", "Buông bỏ"], primaryLens: "demello", secondaryLens: "tolle" },
  { workstream: "C", episodeNumber: 7, title: "Sinh lại từ trên cao", bibleVerses: ["Ga 3:3-8", "Ga 3:16-17"], keywords: ["Tái sinh", "Thần Khí", "Biến đổi", "Sự sống mới"], primaryLens: "rohr", secondaryLens: "tolle" },
  // Phần IV — Khổ đau & Ân sủng
  { workstream: "D", episodeNumber: 1, title: "Gióp: khi Thiên Chúa nói từ cơn lốc", bibleVerses: ["G 38:1-7", "G 42:5"], keywords: ["Gióp", "Khổ đau", "Mầu nhiệm", "Buông kiểm soát"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "D", episodeNumber: 2, title: "Ơn Ta đủ cho con: nghịch lý yếu đuối", bibleVerses: ["2 Cr 12:9-10", "2 Cr 4:7"], keywords: ["Yếu đuối", "Ân sủng", "Nghịch lý", "Buông bỏ"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "D", episodeNumber: 3, title: "Thần Khí rên siết: cầu nguyện khi không còn lời", bibleVerses: ["Rm 8:26-27", "Rm 8:22-23"], keywords: ["Thần Khí", "Rên siết", "Cầu nguyện", "Yếu đuối"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "D", episodeNumber: 4, title: "Đau khổ sinh kiên nhẫn, kiên nhẫn sinh đức hạnh", bibleVerses: ["Rm 5:3-5", "Gc 1:2-4"], keywords: ["Khổ đau", "Kiên nhẫn", "Biến đổi", "Hy vọng"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "D", episodeNumber: 5, title: "Sự sống đời đời không phải ngày mai", bibleVerses: ["Ga 17:3", "1 Ga 5:11-12"], keywords: ["Sự sống đời đời", "Hiện tại", "Nhận biết Thiên Chúa", "Tỉnh thức"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "D", episodeNumber: 6, title: "Ta là đường, sự thật, sự sống", bibleVerses: ["Ga 14:6", "Ga 14:1-3"], keywords: ["Con đường", "Sự thật", "Sự sống", "Tỉnh thức"], primaryLens: "tolle", secondaryLens: "rohr" },
  // Phần V — Hiệp nhất & Vũ trụ
  { workstream: "E", episodeNumber: 1, title: "Xin cho tất cả nên một: phi nhị nguyên", bibleVerses: ["Ga 17:20-23", "Ga 17:11"], keywords: ["Hiệp nhất", "Phi nhị nguyên", "Một", "Tình yêu"], primaryLens: "rohr", secondaryLens: "tolle" },
  { workstream: "E", episodeNumber: 2, title: "Thân thể Đức Kitô: đa dạng trong hiệp nhất", bibleVerses: ["1 Cr 12:12-27", "Ep 4:4-6"], keywords: ["Thân thể", "Đa dạng", "Hiệp nhất", "Cộng đoàn"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "E", episodeNumber: 3, title: "Đức Kitô vũ trụ: Universal Christ", bibleVerses: ["Cl 1:15-20", "Cl 1:27", "Ep 1:10"], keywords: ["Đức Kitô vũ trụ", "Vạn vật", "Hiện diện", "Ân sủng"], primaryLens: "rohr", secondaryLens: "tolle" },
  { workstream: "E", episodeNumber: 4, title: "Thiên nhiên như mặc khải", bibleVerses: ["Tv 19:1-4", "Rm 1:20", "G 12:7-8"], keywords: ["Thiên nhiên", "Mặc khải", "Thiên Chúa trong vạn vật", "Chiêm niệm"], primaryLens: "tolle", secondaryLens: "rohr" },
  { workstream: "E", episodeNumber: 5, title: "Nước hằng sống", bibleVerses: ["Ga 4:10-14", "Ga 7:37-38"], keywords: ["Nước hằng sống", "Khát vọng", "Thỏa mãn", "Hiện diện"], primaryLens: "demello", secondaryLens: "tolle" },
  { workstream: "E", episodeNumber: 6, title: "Diễm Ca: tình yêu thần bí", bibleVerses: ["Dc 2:10-13", "Dc 8:6-7"], keywords: ["Diễm Ca", "Tình yêu thần bí", "Hiệp nhất", "Ân sủng"], primaryLens: "rohr", secondaryLens: "demello" },
];

// ---------------------------------------------------------------------------
// Helpers (same as expand-chapters.ts)
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

function buildSystemPrompt(ws: Workstream, primaryLens: AuthorLens, secondaryLens: AuthorLens): string {
  const part = PART_INFO[ws];
  const primary = AUTHOR_LABELS[primaryLens];
  const secondary = AUTHOR_LABELS[secondaryLens];

  return `Bạn là tác giả của cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi". Đây là sách 5 phần, mỗi phần khám phá một chiều kích khác nhau của hành trình tâm linh tỉnh thức.

${part.title}

NGUYÊN TẮC:
- Kinh Thánh là trục chính. Tác giả chiêm niệm là lăng kính diễn giải, KHÔNG thay thế mặc khải.
- KHÔNG đánh đồng Kitô giáo với Phật giáo.
- Viết như tác giả sách — giọng văn ấm áp, trầm lắng — KHÔNG phải bài blog.

TRẢ VỀ JSON với:

1. **bibleAnchor**: { verses: string[], textVi: string, textEn: string }

2. **keywords**: string[] — 4-6 thuật ngữ chiêm niệm cốt lõi.

3. **theologicalNote**: string — 150-200 từ. Bối cảnh lịch sử và thần học của đoạn Kinh Thánh.

4. **chapterOpening**: string — 250-350 từ. Mở đầu bằng hình ảnh/câu hỏi/tình huống đời thường.

5. **chapterBody**: string — 2000-2800 từ. Essay liền mạch, KHÔNG headers. Tích hợp:
   - Bối cảnh lịch sử/văn hóa của đoạn Kinh Thánh
   - Lăng kính chính: ${primary}
   - Lăng kính phụ: ${secondary}
   - Câu chuyện đời sống minh họa cụ thể

6. **chapterClosing**: string — 200-280 từ. Insight cốt lõi + câu cầu nguyện ngắn.

7. **practiceScript**: { text: string, durationMinutes: number } — 7-10 phút.

TRẢ LỜI JSON HỢP LỆ. Không thêm text nào ngoài JSON.`;
}

async function generateChapter(def: EpisodeDef, prevTitle: string | null, nextTitle: string | null): Promise<void> {
  const part = PART_INFO[def.workstream];

  let contextNote = "";
  if (prevTitle) contextNote += `\n- Chương trước: "${prevTitle}"`;
  if (nextTitle) contextNote += `\n- Chương tiếp: "${nextTitle}"`;

  const userPrompt = `Viết Chương ${def.episodeNumber}/${part.total} của ${part.title}:

Tiêu đề: ${def.title}
Câu Kinh Thánh: ${def.bibleVerses.join(", ")}
Từ khóa: ${def.keywords.join(", ")}
Lăng kính chính: ${AUTHOR_LABELS[def.primaryLens]}
Lăng kính phụ: ${AUTHOR_LABELS[def.secondaryLens]}${contextNote}

${prevTitle ? `Chương trước đã khai phá "${prevTitle}". Tiếp nối tự nhiên từ đó.` : "Đây là chương mở đầu của phần sách này."}
${nextTitle ? `Chương tiếp: "${nextTitle}" — dẫn nhẹ sang hướng đó trong closing.` : "Đây là chương kết phần — mang cảm giác hoàn kết."}

chapterBody phải đủ 2000-2800 từ, tích hợp bối cảnh lịch sử và cả hai lăng kính chiêm niệm.

Trả lời JSON hợp lệ.`;

  console.log(`  [GEN] ${def.workstream}${def.episodeNumber}: ${def.title}`);

  const rawContent = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(def.workstream, def.primaryLens, def.secondaryLens) },
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
        partNumber: part.number,
        partTitle: part.title,
        workstream: def.workstream,
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
        christianContext: "",
        lensInterpretations: [],
        lifeApplication: "",
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

async function verifyChapter(workstream: string, episodeNumber: number): Promise<void> {
  const episode = await Episode.findOne({ workstream, episodeNumber });
  if (!episode) return;
  if (episode.status === "verified" || episode.status === "published") {
    console.log(`  [SKIP] ${episode.slug}`);
    return;
  }

  const prompt = `Xác minh chương sách Kitô giáo chiêm niệm:

TIÊU ĐỀ: ${episode.title}
CÂU KINH THÁNH: ${episode.bibleAnchor.verses.join(", ")}
NỘI DUNG: ${(episode.chapterBody ?? "").slice(0, 3000)}

Kiểm tra: câu Kinh Thánh chính xác, thần học đúng, diễn giải được ghi rõ, không xuyên tạc giáo lý.

JSON: { "isVerified": boolean, "notes": "tiếng Việt", "bibleReferencesChecked": string[] }`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await withRetry(async () => model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  }));

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

  const toProcess = NEW_EPISODES.filter(e => !wsFilter || e.workstream === wsFilter);
  console.log(`=== GENERATING ${toProcess.length} NEW CHAPTERS ===\n`);

  // Group by workstream, maintain order within each
  for (let i = 0; i < toProcess.length; i++) {
    const def = toProcess[i];
    const prev = toProcess[i - 1];
    const next = toProcess[i + 1];
    const prevTitle = prev?.workstream === def.workstream ? prev.title : null;
    const nextTitle = next?.workstream === def.workstream ? next.title : null;

    try {
      await generateChapter(def, prevTitle, nextTitle);
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
    await Episode.updateMany({ workstream: { $in: ["A", "B", "C", "D", "E"] }, status: "verified" }, { $set: { status: "published" } });
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
