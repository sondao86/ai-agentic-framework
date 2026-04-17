/**
 * Expand chapterBody for all 39 chapters to 2000-2500 words.
 * Strategy: generate body as PLAIN TEXT (not JSON) → update DB field only.
 * This avoids JSON mode truncation and forces the model to write full-length prose.
 *
 * Run: npx tsx seed/expand-body.ts [--ws=A|B|C|D|E] [--ep=1]
 */

import mongoose from "mongoose";
import OpenAI from "openai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 180_000, maxRetries: 2 });

const EpisodeSchema = new mongoose.Schema(
  {
    slug: String,
    workstream: String,
    episodeNumber: Number,
    title: String,
    bibleAnchor: { verses: [String], textVi: String, textEn: String },
    keywords: [String],
    chapterOpening: String,
    chapterBody: String,
    chapterClosing: String,
    theologicalNote: String,
    partNumber: Number,
    partTitle: String,
    contemplativeReading: String,
    practiceScript: { text: String, durationMinutes: Number },
    generatedBy: String,
    generationModel: String,
    verification: { isVerified: Boolean, notes: String, bibleReferencesChecked: [String], verifiedAt: Date },
    status: String,
  },
  { timestamps: true }
);

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

// ---------------------------------------------------------------------------
// Author context
// ---------------------------------------------------------------------------

const LENS_CONTEXT: Record<string, string> = {
  tolle: "Eckhart Tolle (tập trung vào Hiện diện, bản ngã, Khoảnh khắc Hiện Tại)",
  demello: "Anthony de Mello (tập trung vào Thức tỉnh, ảo tưởng, nhìn rõ thực tại)",
  rohr: "Richard Rohr (tập trung vào Phi nhị nguyên, Đức Kitô vũ trụ, bao gồm tất cả)",
};

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 8000): Promise<T> {
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
// Generate chapterBody as plain text — no JSON overhead
// ---------------------------------------------------------------------------

async function expandBody(ep: any): Promise<void> {
  const currentWords = (ep.chapterBody ?? "").split(/\s+/).length;
  console.log(`  [GEN] ${ep.workstream}${ep.episodeNumber}: ${ep.title} (hiện có ${currentWords} từ)`);

  const verses = ep.bibleAnchor?.verses?.join(", ") ?? "";
  const keywords = (ep.keywords ?? []).join(", ");

  // Determine primary/secondary lens from existing content clues or default
  const lensHint = ep.theologicalNote ?? ep.chapterOpening ?? "";

  const systemPrompt = `Bạn là tác giả của cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi".

NGUYÊN TẮC VIẾT:
- Kinh Thánh là trục chính. Tác giả chiêm niệm là lăng kính diễn giải, KHÔNG thay thế mặc khải.
- KHÔNG đánh đồng Kitô giáo với Phật giáo.
- Giọng văn: ấm áp, trầm lắng, như người bạn đồng hành khôn ngoan nói chuyện trực tiếp.
- Văn phong: thuần văn xuôi, KHÔNG dùng bullet points, KHÔNG dùng tiêu đề trong bài.

NHIỆM VỤ: Viết phần thân bài (chapterBody) cho chương sách. Đây là phần dài nhất và quan trọng nhất của chương.

YÊU CẦU NGHIÊM NGẶT VỀ ĐỘ DÀI: Bài viết phải có ĐỦ 2000-2500 từ tiếng Việt. Đây là yêu cầu bắt buộc. Hãy viết đầy đủ, không rút ngắn.`;

  const userPrompt = `Viết phần thân bài (chapterBody) cho chương sau:

**Tiêu đề chương:** ${ep.title}
**Thuộc:** ${ep.partTitle}
**Câu Kinh Thánh:** ${verses}
**Từ khóa chiêm niệm:** ${keywords}

**Phần mở đầu đã có** (để bạn tiếp nối tự nhiên):
${ep.chapterOpening ?? "(chưa có)"}

**Ghi chú thần học** (làm nền tảng):
${ep.theologicalNote ?? "(chưa có)"}

---

Hướng dẫn viết chapterBody (2000-2500 từ):

1. **Đoạn 1 — Bối cảnh Kinh Thánh** (~300-400 từ): Bối cảnh lịch sử, văn hóa, hoàn cảnh của đoạn Kinh Thánh này. Đan xen tự nhiên, không như bài học lịch sử.

2. **Đoạn 2-3 — Lăng kính chiêm niệm chính** (~600-700 từ): Khai phá câu Kinh Thánh qua lăng kính chiêm niệm phù hợp (Tolle/de Mello/Rohr). Ghi chú rõ đây là diễn giải. Đào sâu, không chỉ mô tả.

3. **Đoạn 4 — Câu chuyện đời sống** (~400-500 từ): Một câu chuyện cụ thể từ đời sống thực (gia đình, công việc, xung đột nội tâm). Minh họa cho chủ đề chính.

4. **Đoạn 5 — Lăng kính bổ sung** (~300-400 từ): Nhìn từ góc độ một tác giả khác, bổ sung và làm phong phú thêm.

5. **Đoạn 6 — Tổng hợp và câu hỏi sống** (~300-400 từ): Kết nối các luồng suy tư. Đặt ra câu hỏi mở để người đọc tiếp tục suy nghĩ.

Viết liền mạch như một bài essay. Mỗi đoạn phải đủ dài. Tổng cộng phải đạt 2000-2500 từ.
CHỈ trả về nội dung văn xuôi, KHÔNG trả về JSON, KHÔNG thêm tiêu đề hay giải thích.`;

  const body = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 16384,
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content?.trim();
    if (!content) throw new Error("Empty response");

    const words = content.split(/\s+/).length;
    console.log(`    [RAW] finish_reason=${choice.finish_reason}, ${words} từ`);

    if (words < 800) throw new Error(`Too short: ${words} words`);
    return content;
  });

  const wordCount = body.split(/\s+/).length;

  await Episode.updateOne(
    { workstream: ep.workstream, episodeNumber: ep.episodeNumber },
    {
      $set: {
        chapterBody: body,
        contemplativeReading: body,
      },
    }
  );

  console.log(`  [OK] ${ep.workstream}${ep.episodeNumber} — ${wordCount} từ`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const wsFilter = args.find(a => a.startsWith("--ws="))?.split("=")[1];
  const epFilter = args.find(a => a.startsWith("--ep="))?.split("=")[1];
  const minWords = parseInt(args.find(a => a.startsWith("--min="))?.split("=")[1] ?? "1500");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const query: any = { status: "published" };
  if (wsFilter) query.workstream = wsFilter;
  if (epFilter) query.episodeNumber = parseInt(epFilter);

  const episodes = await Episode.find(query).sort({ workstream: 1, episodeNumber: 1 });

  // Filter chapters that need expansion
  const toExpand = episodes.filter(ep => {
    const words = (ep.chapterBody ?? "").split(/\s+/).length;
    return words < minWords;
  });

  console.log(`Found ${toExpand.length} chapters under ${minWords} words (out of ${episodes.length} total)\n`);

  for (const ep of toExpand) {
    try {
      await expandBody(ep);
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  [ERROR] ${ep.workstream}${ep.episodeNumber}: ${err}`);
    }
  }

  // Summary
  const allEps = await Episode.find({ status: "published" });
  const totalWords = allEps.reduce((sum, ep) => {
    return sum + (ep.chapterBody ?? "").split(/\s+/).length;
  }, 0);
  const avgWords = Math.round(totalWords / allEps.length);
  const shortCount = allEps.filter(ep => (ep.chapterBody ?? "").split(/\s+/).length < minWords).length;

  console.log(`\nSummary:`);
  console.log(`  Total chapters: ${allEps.length}`);
  console.log(`  Total chapterBody words: ${totalWords.toLocaleString()}`);
  console.log(`  Average per chapter: ${avgWords} từ`);
  console.log(`  Still under ${minWords} words: ${shortCount}`);

  await mongoose.disconnect();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
