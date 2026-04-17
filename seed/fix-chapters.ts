/**
 * Fix specific failed chapters.
 * Run: npx tsx seed/fix-chapters.ts
 */
import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 3 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EpisodeSchema = new mongoose.Schema(
  {
    slug: String, workstream: String, episodeNumber: Number, title: String,
    bibleAnchor: { verses: [String], textVi: String, textEn: String },
    keywords: [String],
    contemplativeReading: { type: String, default: "" },
    christianContext: { type: String, default: "" },
    lensInterpretations: [{ author: String, content: String }],
    lifeApplication: { type: String, default: "" },
    practiceScript: { text: String, durationMinutes: Number, audioUrl: String, audioGeneratedAt: Date },
    partNumber: Number, partTitle: String,
    chapterOpening: String, chapterBody: String, chapterClosing: String,
    generatedBy: { type: String, default: "chatgpt" }, generationModel: String,
    verification: { isVerified: Boolean, notes: String, bibleReferencesChecked: [String], verifiedAt: Date },
    status: { type: String, default: "draft" },
  },
  { timestamps: true }
);
const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

const AUTHOR_LABELS = { tolle: "Eckhart Tolle", demello: "Anthony de Mello", rohr: "Richard Rohr" } as const;

type Lens = keyof typeof AUTHOR_LABELS;

const MISSING: Array<{
  workstream: "A" | "B"; episodeNumber: number; title: string;
  bibleVerses: string[]; keywords: string[]; lens: Lens;
  prev: string; next: string; totalChapters: number;
}> = [
  // A-3 already fixed, only B-8 remains
  {
    workstream: "B", episodeNumber: 8, title: "Người Samari nhân hậu: từ bi là hành động không phải phe phái",
    bibleVerses: ["Lc 10:25-37"], keywords: ["Từ bi", "Hành động", "Phe phái", "Tình yêu"],
    lens: "demello", prev: "Đứa con hoang đàng: lòng thương xót vượt logic công-tội", next: "Hãy ở lại trong Thầy: ở lại là hiện diện",
    totalChapters: 10,
  },
];

async function withRetry<T>(fn: () => Promise<T>, retries = 4, delayMs = 8000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}/${retries}] waiting ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 1.5;
    }
  }
  throw new Error("Exhausted retries");
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  for (const def of MISSING) {
    const partNumber = def.workstream === "A" ? 1 : 2;
    const partTitle = def.workstream === "A"
      ? "Phần I: Kinh Thánh và bản chất thế giới"
      : "Phần II: Lời dạy từ bi của Đức Giêsu";
    const authorName = AUTHOR_LABELS[def.lens];

    console.log(`\n[GEN] Chương ${def.workstream}-${def.episodeNumber}: ${def.title}`);

    const systemPrompt = `Bạn là tác giả cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức". Giọng văn ấm áp, mạch lạc như tác giả sách.

NGUYÊN TẮC: Kinh Thánh là trục chính. ${authorName} là lăng kính diễn giải. Không đánh đồng với Phật giáo.

JSON CẦN TRẢ VỀ:
1. bibleAnchor: { verses: string[], textVi: string, textEn: string }
2. keywords: string[] (4-6 thuật ngữ)
3. chapterOpening: string (150-200 từ — mở bằng hình ảnh/tình huống, dẫn vào Kinh Thánh)
4. chapterBody: string (900-1100 từ — essay liền mạch: thần học + ${authorName} + đời sống)
5. chapterClosing: string (80-120 từ — tóm insight + bridge sang chương tiếp)
6. practiceScript: { text: string (350-500 từ), durationMinutes: number }

CHỈ TRẢ JSON. KHÔNG thêm text nào khác.`;

    const userPrompt = `Chương ${def.episodeNumber}/${def.totalChapters} của ${partTitle}:
Tiêu đề: ${def.title}
Câu Kinh Thánh: ${def.bibleVerses.join(", ")}
Từ khóa: ${def.keywords.join(", ")}
Lăng kính: ${authorName}
Chương trước: "${def.prev}"
Chương tiếp: "${def.next}"

Giữ nội dung súc tích để JSON không bị truncate.`;

    const raw = await withRetry(async () => {
      const c = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      });
      const content = c.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response");
      return content;
    });

    const g = JSON.parse(raw);

    const num = String(def.episodeNumber).padStart(2, "0");
    const titleSlug = def.title
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${def.workstream.toLowerCase()}-${num}-${titleSlug}`;

    await Episode.findOneAndUpdate(
      { workstream: def.workstream, episodeNumber: def.episodeNumber },
      {
        $set: {
          slug, title: def.title, partNumber, partTitle,
          bibleAnchor: { verses: g.bibleAnchor?.verses ?? def.bibleVerses, textVi: g.bibleAnchor?.textVi ?? "", textEn: g.bibleAnchor?.textEn ?? "" },
          keywords: g.keywords ?? def.keywords,
          chapterOpening: g.chapterOpening ?? "", chapterBody: g.chapterBody ?? "", chapterClosing: g.chapterClosing ?? "",
          contemplativeReading: g.chapterBody ?? "",
          practiceScript: { text: g.practiceScript?.text ?? "", durationMinutes: g.practiceScript?.durationMinutes ?? 5 },
          generatedBy: "chatgpt", generationModel: "gpt-4o", status: "draft",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[OK] ${slug}`);
    await new Promise((r) => setTimeout(r, 3000));

    // Verify with Gemini
    console.log(`[VER] Verifying...`);
    const ep = await Episode.findOne({ workstream: def.workstream, episodeNumber: def.episodeNumber });
    const vPrompt = `Xác minh chương sách Kitô giáo chiêm niệm:
TIÊU ĐỀ: ${ep.title}
CÂU KINH THÁNH: ${ep.bibleAnchor.verses.join(", ")}
NỘI DUNG KINH THÁNH: ${ep.bibleAnchor.textVi}
CHƯƠNG: ${(ep.chapterBody ?? "").slice(0, 2000)}

Kiểm tra: (1) câu Kinh Thánh có tồn tại và trích dẫn chính xác? (2) thần học có chính xác? (3) diễn giải có ghi rõ là diễn giải? (4) có xuyên tạc giáo lý không?
JSON: { "isVerified": boolean, "notes": "tiếng Việt", "bibleReferencesChecked": string[] }`;

    const vText = await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const r = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: vPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      return r.response.text();
    });

    let v: { isVerified: boolean; notes: string; bibleReferencesChecked: string[] };
    try {
      v = JSON.parse(vText);
    } catch {
      // Gemini sometimes returns invalid JSON — extract key fields manually
      const isVerified = /\"isVerified\"\s*:\s*true/i.test(vText);
      const notesMatch = vText.match(/"notes"\s*:\s*"([^"]+)"/);
      v = { isVerified, notes: notesMatch?.[1] ?? "Parse error", bibleReferencesChecked: [] };
    }
    await Episode.findOneAndUpdate(
      { workstream: def.workstream, episodeNumber: def.episodeNumber },
      {
        $set: {
          verification: { isVerified: v.isVerified, notes: v.notes, bibleReferencesChecked: v.bibleReferencesChecked, verifiedAt: new Date() },
          ...(v.isVerified ? { status: "verified" } : {}),
        },
      }
    );
    console.log(`[${v.isVerified ? "PASS" : "FAIL"}] ${slug}: ${v.notes?.slice(0, 80)}`);
    await new Promise((r) => setTimeout(r, 6000));
  }

  await Episode.updateMany({ status: "verified" }, { $set: { status: "published" } });

  const stats = {
    total: await Episode.countDocuments(),
    published: await Episode.countDocuments({ status: "published" }),
    bookFormat: await Episode.countDocuments({ chapterBody: { $exists: true, $ne: "" } }),
  };
  console.log(`\n=== DONE ===`);
  console.log(`Total: ${stats.total} | Published: ${stats.published} | Book format: ${stats.bookFormat}`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
