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

const AL: Record<string, string> = { tolle: "Eckhart Tolle", demello: "Anthony de Mello", rohr: "Richard Rohr" };

function slug(ws: string, n: number, t: string) {
  return `${ws.toLowerCase()}-${String(n).padStart(2, "0")}-${t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

const MISSING = [
  { workstream: "A", episodeNumber: 3, title: "Dung lo lang ve ngay mai", bibleVerses: ["Mt 6:25-34"], keywords: ["Hien tai", "Lo lang", "Tam tri", "Buong bo"], lens: "tolle" },
  { workstream: "A", episodeNumber: 8, title: "Tinh yeu nhu ban the (Agape)", bibleVerses: ["1 Cr 13:4-7", "1 Ga 4:8", "1 Ga 4:16"], keywords: ["Agape", "Tinh yeu", "Tinh thuc", "Ban the"], lens: "tolle" },
  { workstream: "B", episodeNumber: 8, title: "Nguoi Samari nhan hau: tu bi la hanh dong khong phai phe phai", bibleVerses: ["Lc 10:25-37"], keywords: ["Tu bi", "Hanh dong", "Phe phai", "Tinh yeu"], lens: "demello" },
];

async function generateField(prompt: string): Promise<string> {
  const comp = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return comp.choices[0]?.message?.content?.trim() ?? "";
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  for (const d of MISSING) {
    const s = slug(d.workstream, d.episodeNumber, d.title);
    const existing = await Episode.findOne({ slug: s });
    if (existing) { console.log(`[SKIP] ${s}`); continue; }

    console.log(`[GEN] ${s} - generating field by field...`);
    try {
      const base = `Chủ đề: "${d.title}". Kinh Thánh: ${d.bibleVerses.join(", ")}. Lăng kính: ${AL[d.lens]}.`;

      const [bibleText, contemplative, context, lens, app, practice] = await Promise.all([
        generateField(`${base}\n\nCung cấp bản dịch tiếng Việt của ${d.bibleVerses.join(", ")} (trích từ bản dịch phổ biến). Chỉ trả lời phần văn bản, không thêm gì khác.`),
        generateField(`${base}\n\nViết bài đọc chiêm niệm 400-600 từ bằng tiếng Việt. Khai mở ý nghĩa tâm linh sâu xa. Giọng văn ấm áp, trầm lắng. Kinh Thánh là trục chính.`),
        generateField(`${base}\n\nViết bối cảnh thần học Kitô giáo 150-200 từ bằng tiếng Việt. Giải thích vị trí đoạn Kinh Thánh trong truyền thống Kitô giáo.`),
        generateField(`${base}\n\nViết diễn giải qua lăng kính ${AL[d.lens]} 300-400 từ bằng tiếng Việt. GHI RÕ đây là DIỄN GIẢI chiêm niệm, không phải giáo lý. Trích dẫn từ tác phẩm của ${AL[d.lens]}. Không đánh đồng Kitô giáo với Phật giáo.`),
        generateField(`${base}\n\nViết ứng dụng thực tế trong đời sống 150-200 từ bằng tiếng Việt. Liên hệ với xung đột, tổn thương, công việc, gia đình.`),
        generateField(`${base}\n\nViết kịch bản hướng dẫn thực hành chiêm niệm 5 phút bằng tiếng Việt. Gồm: mở đầu (hít thở), phần chính (hướng dẫn từng bước), kết thúc. Viết như đang nói trực tiếp với người nghe.`),
      ]);

      const bibleEn = await generateField(`Provide the NIV English text for ${d.bibleVerses.join(", ")}. Only the Bible text, nothing else.`);

      await Episode.findOneAndUpdate(
        { slug: s },
        {
          $set: {
            slug: s, workstream: d.workstream, episodeNumber: d.episodeNumber, title: d.title,
            bibleAnchor: { verses: d.bibleVerses, textVi: bibleText, textEn: bibleEn },
            contemplativeReading: contemplative,
            keywords: d.keywords,
            christianContext: context,
            lensInterpretations: [{ author: d.lens, content: lens }],
            lifeApplication: app,
            practiceScript: { text: practice, durationMinutes: 5 },
            generatedBy: "chatgpt", generationModel: "gpt-4o", status: "published",
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[OK] ${s}`);
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[ERROR] ${s}: ${err}`);
    }
  }

  const total = await Episode.countDocuments();
  const pub = await Episode.countDocuments({ status: "published" });
  console.log(`\nFinal: ${total} total, ${pub} published.`);
  await mongoose.disconnect();
}

main().catch(console.error);
