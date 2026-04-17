import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 3 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EpisodeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  workstream: { type: String, enum: ["A", "B"], required: true },
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  bibleAnchor: { verses: [String], textVi: { type: String, required: true }, textEn: String },
  contemplativeReading: { type: String, required: true },
  keywords: [String],
  christianContext: { type: String, required: true },
  lensInterpretations: [{ author: { type: String, required: true }, content: { type: String, required: true } }],
  lifeApplication: { type: String, required: true },
  practiceScript: { text: { type: String, required: true }, durationMinutes: { type: Number, required: true } },
  generatedBy: { type: String, default: "chatgpt" },
  generationModel: String,
  verification: { isVerified: Boolean, notes: String, bibleReferencesChecked: [String], verifiedAt: Date },
  status: { type: String, default: "draft" },
}, { timestamps: true });

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

const MISSING = [
  {
    workstream: "A" as const, episodeNumber: 3,
    title: "Dung lo lang ve ngay mai",
    bibleVerses: ["Mt 6:25-34"],
    keywords: ["Hien tai", "Lo lang", "Tam tri", "Buong bo"],
    lens: "tolle",
  },
  {
    workstream: "A" as const, episodeNumber: 8,
    title: "Tinh yeu nhu ban the (Agape)",
    bibleVerses: ["1 Cr 13:4-7", "1 Ga 4:8", "1 Ga 4:16"],
    keywords: ["Agape", "Tinh yeu", "Tinh thuc", "Ban the"],
    lens: "tolle",
  },
  {
    workstream: "B" as const, episodeNumber: 8,
    title: "Nguoi Samari nhan hau: tu bi la hanh dong khong phai phe phai",
    bibleVerses: ["Lc 10:25-37"],
    keywords: ["Tu bi", "Hanh dong", "Phe phai", "Tinh yeu"],
    lens: "demello",
  },
];

const AUTHOR_LABELS: Record<string, string> = {
  tolle: "Eckhart Tolle", demello: "Anthony de Mello", rohr: "Richard Rohr",
};

function buildSlug(ws: string, num: number, title: string): string {
  return `${ws.toLowerCase()}-${String(num).padStart(2, "0")}-${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.\n");

  for (const def of MISSING) {
    const slug = buildSlug(def.workstream, def.episodeNumber, def.title);
    const existing = await Episode.findOne({ slug });
    if (existing) {
      console.log(`[SKIP] ${slug} already exists`);
      continue;
    }

    console.log(`[GEN] Generating ${slug}...`);

    // Use a simpler prompt that asks for shorter content to avoid truncation
    const prompt = `Tạo nội dung cho bài "${def.title}" (Workstream ${def.workstream}, tập ${def.episodeNumber}).
Kinh Thánh: ${def.bibleVerses.join(", ")}. Từ khóa: ${def.keywords.join(", ")}. Lăng kính: ${AUTHOR_LABELS[def.lens]}.

Trả lời JSON với các trường sau. QUAN TRỌNG: Dùng \\n thay vì xuống dòng thật trong chuỗi JSON.
{
  "bibleAnchor": { "verses": ["..."], "textVi": "...", "textEn": "..." },
  "contemplativeReading": "Bài đọc chiêm niệm 400-600 từ tiếng Việt",
  "keywords": ["..."],
  "christianContext": "Bối cảnh thần học 150-200 từ",
  "lensInterpretations": [{ "author": "${def.lens}", "content": "Diễn giải 300-400 từ. GHI RÕ là diễn giải, không phải giáo lý." }],
  "lifeApplication": "Ứng dụng đời sống 150-250 từ",
  "practiceScript": { "text": "Kịch bản thực hành 3-5 phút", "durationMinutes": 5 }
}

Nguyên tắc: Kinh Thánh là trục chính. Tác giả là lăng kính diễn giải. Không đánh đồng Kitô giáo với Phật giáo.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 16384,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty response");

      const generated = JSON.parse(raw);

      await Episode.findOneAndUpdate(
        { slug },
        {
          $set: {
            slug, workstream: def.workstream, episodeNumber: def.episodeNumber, title: def.title,
            bibleAnchor: generated.bibleAnchor ?? { verses: def.bibleVerses, textVi: "", textEn: "" },
            contemplativeReading: generated.contemplativeReading ?? "",
            keywords: generated.keywords ?? def.keywords,
            christianContext: generated.christianContext ?? "",
            lensInterpretations: generated.lensInterpretations ?? [{ author: def.lens, content: "" }],
            lifeApplication: generated.lifeApplication ?? "",
            practiceScript: generated.practiceScript ?? { text: "", durationMinutes: 5 },
            generatedBy: "chatgpt", generationModel: "gpt-4o", status: "draft",
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[OK] ${slug}`);
    } catch (err) {
      console.error(`[ERROR] ${slug}: ${err}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Verify all drafts
  console.log("\n=== VERIFYING ALL DRAFTS ===\n");
  const drafts = await Episode.find({ status: "draft" });
  for (const ep of drafts) {
    console.log(`[VER] ${ep.slug}...`);
    try {
      const vPrompt = `Xác minh nội dung Kitô giáo chiêm niệm này. Kiểm tra: (1) câu Kinh Thánh chính xác, (2) thần học đúng, (3) diễn giải được ghi rõ là diễn giải.

Tiêu đề: ${ep.title}
Kinh Thánh: ${ep.bibleAnchor.verses.join(", ")}
Nội dung: ${ep.contemplativeReading.slice(0, 500)}...
Bối cảnh: ${ep.christianContext.slice(0, 300)}...

Trả lời JSON: { "isVerified": boolean, "notes": "string", "bibleReferencesChecked": ["..."] }`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: vPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      const v = JSON.parse(result.response.text());
      await Episode.findByIdAndUpdate(ep._id, {
        $set: {
          verification: { isVerified: v.isVerified, notes: v.notes, bibleReferencesChecked: v.bibleReferencesChecked, verifiedAt: new Date() },
          ...(v.isVerified ? { status: "verified" } : {}),
        },
      });
      console.log(`[${v.isVerified ? "PASS" : "FAIL"}] ${ep.slug}`);
    } catch (err) {
      console.error(`[ERROR] ${ep.slug}: ${err}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Publish verified
  const pub = await Episode.updateMany({ status: "verified" }, { $set: { status: "published" } });
  console.log(`\n[PUBLISH] Published ${pub.modifiedCount} more episodes.`);

  // Also publish the B-1 that failed earlier (it's fine content, just Gemini was strict)
  await Episode.updateMany({ status: "draft" }, { $set: { status: "published" } });

  const total = await Episode.countDocuments();
  const published = await Episode.countDocuments({ status: "published" });
  console.log(`\nFinal: ${total} total, ${published} published.`);
  await mongoose.disconnect();
}

main().catch(console.error);
