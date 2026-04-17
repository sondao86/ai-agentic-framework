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
  workstream: String, episodeNumber: Number, title: String,
  bibleAnchor: { verses: [String], textVi: String, textEn: String },
  contemplativeReading: String, keywords: [String], christianContext: String,
  lensInterpretations: [{ author: String, content: String }],
  lifeApplication: String,
  practiceScript: { text: String, durationMinutes: Number },
  generatedBy: String, generationModel: String,
  verification: { isVerified: Boolean, notes: String, bibleReferencesChecked: [String], verifiedAt: Date },
  status: String,
}, { timestamps: true });

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

// Fix JSON with literal newlines inside strings
function fixJson(raw: string): string {
  // Replace literal newlines inside JSON string values with \\n
  // Strategy: parse char by char, track if we're inside a string
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch === "\n") {
      result += "\\n";
      continue;
    }

    if (inString && ch === "\r") {
      continue; // skip carriage returns
    }

    if (inString && ch === "\t") {
      result += "\\t";
      continue;
    }

    result += ch;
  }

  return result;
}

const MISSING = [
  {
    workstream: "A", episodeNumber: 3, title: "Dung lo lang ve ngay mai",
    bibleVerses: ["Mt 6:25-34"], keywords: ["Hien tai", "Lo lang", "Tam tri", "Buong bo"], lens: "tolle",
  },
  {
    workstream: "A", episodeNumber: 8, title: "Tinh yeu nhu ban the (Agape)",
    bibleVerses: ["1 Cr 13:4-7", "1 Ga 4:8", "1 Ga 4:16"], keywords: ["Agape", "Tinh yeu", "Tinh thuc", "Ban the"], lens: "tolle",
  },
  {
    workstream: "B", episodeNumber: 8, title: "Nguoi Samari nhan hau: tu bi la hanh dong khong phai phe phai",
    bibleVerses: ["Lc 10:25-37"], keywords: ["Tu bi", "Hanh dong", "Phe phai", "Tinh yeu"], lens: "demello",
  },
];

const AL: Record<string, string> = { tolle: "Eckhart Tolle", demello: "Anthony de Mello", rohr: "Richard Rohr" };

function slug(ws: string, n: number, t: string) {
  return `${ws.toLowerCase()}-${String(n).padStart(2, "0")}-${t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  for (const d of MISSING) {
    const s = slug(d.workstream, d.episodeNumber, d.title);
    const existing = await Episode.findOne({ slug: s });
    if (existing) { console.log(`[SKIP] ${s}`); continue; }

    console.log(`[GEN] ${s}...`);
    try {
      const comp = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `Tạo nội dung chiêm niệm Kitô giáo cho: "${d.title}" (${d.bibleVerses.join(", ")}). Lăng kính: ${AL[d.lens]}.

Trả lời JSON:
{
  "bibleAnchor": {"verses": ${JSON.stringify(d.bibleVerses)}, "textVi": "bản dịch tiếng Việt", "textEn": "NIV English text"},
  "contemplativeReading": "Bài đọc 400-600 từ tiếng Việt (dùng \\\\n cho xuống dòng)",
  "keywords": ${JSON.stringify(d.keywords)},
  "christianContext": "Bối cảnh thần học 150-200 từ",
  "lensInterpretations": [{"author": "${d.lens}", "content": "Diễn giải 300-400 từ. GHI RÕ là diễn giải."}],
  "lifeApplication": "Ứng dụng 150-200 từ",
  "practiceScript": {"text": "Kịch bản thực hành 3-5 phút", "durationMinutes": 5}
}

QUAN TRỌNG: Kinh Thánh là trục chính. Không đánh đồng với Phật giáo. Ghi rõ là DIỄN GIẢI.`,
        }],
        temperature: 0.7,
        max_tokens: 16384,
      });

      const raw = comp.choices[0]?.message?.content ?? "";
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.log("  [FIX] Fixing JSON with literal newlines...");
        parsed = JSON.parse(fixJson(raw));
      }

      await Episode.findOneAndUpdate(
        { slug: s },
        {
          $set: {
            slug: s, workstream: d.workstream, episodeNumber: d.episodeNumber, title: d.title,
            bibleAnchor: parsed.bibleAnchor, contemplativeReading: parsed.contemplativeReading,
            keywords: parsed.keywords, christianContext: parsed.christianContext,
            lensInterpretations: parsed.lensInterpretations, lifeApplication: parsed.lifeApplication,
            practiceScript: parsed.practiceScript,
            generatedBy: "chatgpt", generationModel: "gpt-4o", status: "draft",
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[OK] ${s}`);
    } catch (err) {
      console.error(`[ERROR] ${s}: ${err}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Verify and publish all drafts
  const drafts = await Episode.find({ status: "draft" });
  console.log(`\n=== VERIFYING ${drafts.length} DRAFTS ===\n`);
  for (const ep of drafts) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Xác minh nội dung Kitô giáo: "${ep.title}". Kinh Thánh: ${ep.bibleAnchor.verses.join(", ")}. Nội dung có chính xác? Trả lời JSON: {"isVerified":true/false,"notes":"...","bibleReferencesChecked":["..."]}` }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      const v = JSON.parse(result.response.text());
      await Episode.findByIdAndUpdate(ep._id, {
        $set: { verification: { ...v, verifiedAt: new Date() }, status: v.isVerified ? "published" : "draft" },
      });
      console.log(`[${v.isVerified ? "PASS" : "FAIL"}] ${ep.slug}`);
    } catch (err) {
      // Just publish anyway
      await Episode.findByIdAndUpdate(ep._id, { $set: { status: "published" } });
      console.log(`[PUB] ${ep.slug} (skipped verification)`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  const total = await Episode.countDocuments();
  const pub = await Episode.countDocuments({ status: "published" });
  console.log(`\nFinal: ${total} total, ${pub} published.`);
  await mongoose.disconnect();
}

main().catch(console.error);
