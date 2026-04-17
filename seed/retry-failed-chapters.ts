/**
 * Retry failed chapters: B8, D2, D4, D6, E1, E3, E6
 * Also publish draft chapters: D3, D5, E2, E4, E5
 * Fix: sanitize raw JSON (escape literal newlines in strings) + remove textVi/textEn from schema
 * Run: npx tsx seed/retry-failed-chapters.ts [--no-verify]
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
// Chapters to retry
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

const AUTHOR_LABELS: Record<AuthorLens, string> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
};

const PART_INFO: Record<Workstream, { number: number; title: string; total: number }> = {
  A: { number: 1, title: "Phần I: Kinh Thánh và bản chất thế giới", total: 9 },
  B: { number: 2, title: "Phần II: Lời dạy từ bi của Đức Giêsu", total: 11 },
  C: { number: 3, title: "Phần III: Hành trình nội tâm — Cầu nguyện & Tĩnh lặng", total: 7 },
  D: { number: 4, title: "Phần IV: Khổ đau, Yếu đuối & Ân sủng", total: 6 },
  E: { number: 5, title: "Phần V: Hiệp nhất, Cộng đoàn & Vũ trụ", total: 6 },
};

const FAILED_CHAPTERS: EpisodeDef[] = [
  // B8 — expand-chapters failed
  { workstream: "B", episodeNumber: 8, title: "Người Samari nhân hậu: từ bi là hành động không phải phe phái", bibleVerses: ["Lc 10:25-37"], keywords: ["Từ bi", "Hành động", "Phe phái", "Tình yêu"], primaryLens: "demello", secondaryLens: "rohr" },
  // D — generate-new failed
  { workstream: "D", episodeNumber: 2, title: "Ơn Ta đủ cho con: nghịch lý yếu đuối", bibleVerses: ["2 Cr 12:9-10", "2 Cr 4:7"], keywords: ["Yếu đuối", "Ân sủng", "Nghịch lý", "Buông bỏ"], primaryLens: "demello", secondaryLens: "rohr" },
  { workstream: "D", episodeNumber: 4, title: "Đau khổ sinh kiên nhẫn, kiên nhẫn sinh đức hạnh", bibleVerses: ["Rm 5:3-5", "Gc 1:2-4"], keywords: ["Khổ đau", "Kiên nhẫn", "Biến đổi", "Hy vọng"], primaryLens: "rohr", secondaryLens: "demello" },
  { workstream: "D", episodeNumber: 6, title: "Ta là đường, sự thật, sự sống", bibleVerses: ["Ga 14:6", "Ga 14:1-3"], keywords: ["Con đường", "Sự thật", "Sự sống", "Tỉnh thức"], primaryLens: "tolle", secondaryLens: "rohr" },
  // E — generate-new failed
  { workstream: "E", episodeNumber: 1, title: "Xin cho tất cả nên một: phi nhị nguyên", bibleVerses: ["Ga 17:20-23", "Ga 17:11"], keywords: ["Hiệp nhất", "Phi nhị nguyên", "Một", "Tình yêu"], primaryLens: "rohr", secondaryLens: "tolle" },
  { workstream: "E", episodeNumber: 3, title: "Đức Kitô vũ trụ: Universal Christ", bibleVerses: ["Cl 1:15-20", "Cl 1:27", "Ep 1:10"], keywords: ["Đức Kitô vũ trụ", "Vạn vật", "Hiện diện", "Ân sủng"], primaryLens: "rohr", secondaryLens: "tolle" },
  { workstream: "E", episodeNumber: 6, title: "Diễm Ca: tình yêu thần bí", bibleVerses: ["Dc 2:10-13", "Dc 8:6-7"], keywords: ["Diễm Ca", "Tình yêu thần bí", "Hiệp nhất", "Ân sủng"], primaryLens: "rohr", secondaryLens: "demello" },
];

// ---------------------------------------------------------------------------
// Fix: sanitize raw JSON — escape literal newlines/tabs within string values
// ---------------------------------------------------------------------------

function sanitizeJson(raw: string): string {
  // Remove markdown code block if present
  const stripped = raw.replace(/^```json\s*\n?|\n?```\s*$/g, "").trim();

  // Replace unescaped literal newlines/tabs/carriage-returns inside JSON string values.
  // Strategy: parse character by character tracking whether we're inside a string.
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
    }

    result += ch;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 8000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}/${retries}] ${err} — waiting ${delayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 1.5;
    }
  }
  throw new Error("Exhausted retries");
}

// ---------------------------------------------------------------------------
// Generate chapter — note: removed textVi/textEn from bibleAnchor to avoid truncation
// ---------------------------------------------------------------------------

function buildPrompt(def: EpisodeDef): { system: string; user: string } {
  const part = PART_INFO[def.workstream];
  const primary = AUTHOR_LABELS[def.primaryLens];
  const secondary = AUTHOR_LABELS[def.secondaryLens];

  const system = `Bạn là tác giả sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi".

NGUYÊN TẮC:
- Kinh Thánh là trục chính. Tác giả chiêm niệm là lăng kính, không thay thế mặc khải.
- KHÔNG đánh đồng Kitô giáo với Phật giáo.
- Giọng văn ấm áp, trầm lắng, như người bạn đồng hành.

TRẢ VỀ JSON với cấu trúc sau (KHÔNG thêm text nào ngoài JSON, KHÔNG dùng literal newline trong string):

{
  "bibleAnchor": { "verses": ["..."] },
  "keywords": ["...", "..."],
  "theologicalNote": "150-200 từ bối cảnh thần học/lịch sử của đoạn Kinh Thánh",
  "chapterOpening": "250-350 từ mở đầu bằng hình ảnh đời thường",
  "chapterBody": "2000-2500 từ essay liền mạch, tích hợp lăng kính ${primary} (chính) và ${secondary} (phụ), câu chuyện đời sống cụ thể. KHÔNG dùng headers.",
  "chapterClosing": "200-250 từ insight cốt lõi + câu cầu nguyện ngắn",
  "practiceScript": { "text": "500-600 từ hướng dẫn thực hành", "durationMinutes": 8 }
}

QUAN TRỌNG: Tất cả string values trong JSON phải escape newlines thành \\n, KHÔNG dùng ký tự xuống dòng thực trong JSON string.`;

  const user = `Viết Chương ${def.episodeNumber}/${part.total} — ${part.title}:

Tiêu đề: ${def.title}
Câu Kinh Thánh: ${def.bibleVerses.join(", ")}
Từ khóa: ${def.keywords.join(", ")}
Lăng kính chính: ${primary}
Lăng kính phụ: ${secondary}

Trả lời JSON hợp lệ duy nhất, không markdown, không giải thích.`;

  return { system, user };
}

async function retryChapter(def: EpisodeDef): Promise<void> {
  console.log(`  [GEN] ${def.workstream}${def.episodeNumber}: ${def.title}`);

  const { system, user } = buildPrompt(def);

  const rawContent = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 16384,
    });

    const choice = completion.choices[0];
    const finishReason = choice?.finish_reason;
    if (finishReason === "length") {
      throw new Error(`Response truncated (finish_reason: length)`);
    }

    const content = choice?.message?.content;
    if (!content) throw new Error("Empty response");

    console.log(`    [RAW] finish_reason=${finishReason}, length=${content.length} chars`);
    return content;
  });

  const sanitized = sanitizeJson(rawContent);
  const generated = JSON.parse(sanitized);

  const part = PART_INFO[def.workstream];
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
          textVi: "",
          textEn: "",
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
          durationMinutes: generated.practiceScript?.durationMinutes ?? 8,
        },
        generatedBy: "chatgpt",
        generationModel: "gpt-4o",
        status: "draft",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const bodyWords = (generated.chapterBody ?? "").split(/\s+/).length;
  console.log(`  [OK] ${slug} — body: ${bodyWords} từ`);
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
NỘI DUNG: ${(episode.chapterBody ?? "").slice(0, 3000)}

Kiểm tra:
1. Câu Kinh Thánh có tồn tại không?
2. Thần học Kitô giáo có chính xác không?
3. Diễn giải chiêm niệm có ghi rõ là diễn giải không?
4. Có nội dung xuyên tạc giáo lý không?

JSON: { "isVerified": boolean, "notes": "tiếng Việt", "bibleReferencesChecked": string[] }`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
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

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  // Step 1: Retry 7 failed chapters
  console.log(`=== RETRYING ${FAILED_CHAPTERS.length} FAILED CHAPTERS ===\n`);
  for (const def of FAILED_CHAPTERS) {
    try {
      await retryChapter(def);
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  [ERROR] ${def.workstream}${def.episodeNumber}: ${err}`);
    }
  }

  if (!skipVerify) {
    // Step 2: Verify all draft chapters (includes D3, D5, E2, E4, E5 + newly generated)
    console.log("\n=== VERIFYING ALL DRAFT CHAPTERS ===\n");
    const drafts = await Episode.find({ status: "draft" }, { workstream: 1, episodeNumber: 1 });
    for (const ep of drafts) {
      try {
        await verifyChapter(ep.workstream, ep.episodeNumber);
        await new Promise(r => setTimeout(r, 4000));
      } catch (err) {
        console.error(`  [ERROR] verify ${ep.workstream}${ep.episodeNumber}: ${err}`);
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
