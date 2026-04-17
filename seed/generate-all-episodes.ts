import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config({ path: ".env.local" });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120_000,
  maxRetries: 3,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 5000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}/${retries}] ${err instanceof Error ? err.message : err} - waiting ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 1.5; // exponential backoff
    }
  }
  throw new Error("Exhausted retries");
}

// ---------------------------------------------------------------------------
// Episode Schema (inline to avoid path alias issues in tsx)
// ---------------------------------------------------------------------------

const EpisodeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    workstream: { type: String, enum: ["A", "B"], required: true, index: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    bibleAnchor: {
      verses: [{ type: String }],
      textVi: { type: String, required: true },
      textEn: { type: String },
    },
    contemplativeReading: { type: String, required: true },
    keywords: [{ type: String }],
    christianContext: { type: String, required: true },
    lensInterpretations: [
      {
        author: { type: String, enum: ["tolle", "demello", "rohr"], required: true },
        content: { type: String, required: true },
      },
    ],
    lifeApplication: { type: String, required: true },
    practiceScript: {
      text: { type: String, required: true },
      durationMinutes: { type: Number, required: true, min: 3, max: 7 },
      audioUrl: { type: String },
      audioGeneratedAt: { type: Date },
    },
    generatedBy: { type: String, enum: ["chatgpt", "manual"], default: "chatgpt" },
    generationModel: { type: String },
    verification: {
      isVerified: { type: Boolean },
      notes: { type: String },
      bibleReferencesChecked: [{ type: String }],
      verifiedAt: { type: Date },
    },
    status: { type: String, enum: ["draft", "verified", "published"], default: "draft", index: true },
  },
  { timestamps: true }
);

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

// ---------------------------------------------------------------------------
// Episode definitions from content.md
// ---------------------------------------------------------------------------

type AuthorLens = "tolle" | "demello" | "rohr";

interface EpisodeDef {
  workstream: "A" | "B";
  episodeNumber: number;
  title: string;
  bibleVerses: string[];
  keywords: string[];
  lens: AuthorLens;
}

const EPISODES: EpisodeDef[] = [
  // ===== Workstream A: "Kinh Thanh noi gi ve ban chat the gioi" =====
  {
    workstream: "A",
    episodeNumber: 1,
    title: "Kenosis: Con duong rong de day an sung",
    bibleVerses: ["Pl 2:6-7", "Pl 2:8-11"],
    keywords: ["Kenosis", "Tu-rong", "Ban nga", "An sung", "Buong bo"],
    lens: "rohr",
  },
  {
    workstream: "A",
    episodeNumber: 2,
    title: "Trong Ngai ta hien huu",
    bibleVerses: ["Cv 17:28", "Cv 17:24-28"],
    keywords: ["Hien huu", "Hien dien", "Thien Chua", "Tinh thuc"],
    lens: "tolle",
  },
  {
    workstream: "A",
    episodeNumber: 3,
    title: "Dung lo lang ve ngay mai",
    bibleVerses: ["Mt 6:25-34"],
    keywords: ["Hien tai", "Lo lang", "Tam tri", "Buong bo"],
    lens: "tolle",
  },
  {
    workstream: "A",
    episodeNumber: 4,
    title: "Ai muon giu mang song minh se mat",
    bibleVerses: ["Mt 16:25", "Mc 8:35", "Lc 9:24"],
    keywords: ["Nghich ly", "Ban nga", "Buong bo", "Tu do"],
    lens: "demello",
  },
  {
    workstream: "A",
    episodeNumber: 5,
    title: "TA LA (I AM): Hien huu vuot nhan dan",
    bibleVerses: ["Xh 3:14", "Ga 8:58"],
    keywords: ["TA LA", "Hien huu", "Can tinh", "Phi nhi nguyen"],
    lens: "tolle",
  },
  {
    workstream: "A",
    episodeNumber: 6,
    title: "Thap gia nhu cai chet cua cai toi",
    bibleVerses: ["Gl 2:20", "Mt 16:24", "Rm 6:6"],
    keywords: ["Thap gia", "Ban nga", "Buong bam", "Bien doi"],
    lens: "rohr",
  },
  {
    workstream: "A",
    episodeNumber: 7,
    title: "Phuc sinh nhu doi song moi",
    bibleVerses: ["Rm 6:4", "2 Cr 5:17", "Gl 6:15"],
    keywords: ["Phuc sinh", "Doi moi", "Bien doi", "Can tinh"],
    lens: "rohr",
  },
  {
    workstream: "A",
    episodeNumber: 8,
    title: "Tinh yeu nhu ban the (Agape)",
    bibleVerses: ["1 Cr 13:4-7", "1 Ga 4:8", "1 Ga 4:16"],
    keywords: ["Agape", "Tinh yeu", "Tinh thuc", "Ban the"],
    lens: "tolle",
  },

  // ===== Workstream B: "Loi day tu bi cua Duc Giesu" =====
  {
    workstream: "B",
    episodeNumber: 1,
    title: "Tha thu vi ho khong biet",
    bibleVerses: ["Lc 23:34"],
    keywords: ["Tha thu", "Vo minh", "Tu bi", "Tinh thuc"],
    lens: "tolle",
  },
  {
    workstream: "B",
    episodeNumber: 2,
    title: "Dung xet doan: xet doan la co che tu ve cua ban nga",
    bibleVerses: ["Mt 7:1-2", "Lc 6:37"],
    keywords: ["Phan xet", "Ban nga", "Tu do", "Tinh thuc"],
    lens: "demello",
  },
  {
    workstream: "B",
    episodeNumber: 3,
    title: "Phuoc cho ai hien lanh",
    bibleVerses: ["Mt 5:5", "Mt 5:3-12"],
    keywords: ["Hien lanh", "Suc manh", "Buong bo", "An binh"],
    lens: "tolle",
  },
  {
    workstream: "B",
    episodeNumber: 4,
    title: "Yeu ke thu: ranh gioi van co nhung khong nuoi thu han",
    bibleVerses: ["Mt 5:44", "Lc 6:27-28"],
    keywords: ["Yeu ke thu", "Tu bi", "Tha thu", "Tinh thuc"],
    lens: "demello",
  },
  {
    workstream: "B",
    episodeNumber: 5,
    title: "Khi bi tat mot ben ma: khong phan ung vo thuc",
    bibleVerses: ["Mt 5:39", "Lc 6:29"],
    keywords: ["Khong phan ung", "Tinh thuc", "Ban nga", "Tu do"],
    lens: "tolle",
  },
  {
    workstream: "B",
    episodeNumber: 6,
    title: "Nguoi khong co toi nem da truoc",
    bibleVerses: ["Ga 8:7", "Ga 8:1-11"],
    keywords: ["Phan xet", "Tu bi", "Dam dong", "Tinh thuc"],
    lens: "demello",
  },
  {
    workstream: "B",
    episodeNumber: 7,
    title: "Dua con hoang dang: long thuong xot vuot logic cong toi",
    bibleVerses: ["Lc 15:11-32"],
    keywords: ["Thuong xot", "An sung", "Ban nga", "Doi moi"],
    lens: "rohr",
  },
  {
    workstream: "B",
    episodeNumber: 8,
    title: "Nguoi Samari nhan hau: tu bi la hanh dong khong phai phe phai",
    bibleVerses: ["Lc 10:25-37"],
    keywords: ["Tu bi", "Hanh dong", "Phe phai", "Tinh yeu"],
    lens: "demello",
  },
  {
    workstream: "B",
    episodeNumber: 9,
    title: "Hay o lai trong Thay: o lai la hien dien",
    bibleVerses: ["Ga 15:4-5", "Ga 15:9-10"],
    keywords: ["O lai", "Hien dien", "Tinh thuc", "Ket noi"],
    lens: "tolle",
  },
  {
    workstream: "B",
    episodeNumber: 10,
    title: "Nuoc Troi o gan: gan la ngay day ngay luc nay",
    bibleVerses: ["Mc 1:15", "Lc 17:21"],
    keywords: ["Nuoc Troi", "Hien tai", "Tinh thuc", "Hien dien"],
    lens: "rohr",
  },
];

// ---------------------------------------------------------------------------
// Author labels
// ---------------------------------------------------------------------------

const AUTHOR_LABELS: Record<AuthorLens, string> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(lens: AuthorLens): string {
  const authorName = AUTHOR_LABELS[lens];
  return `Bạn là một chuyên gia về Kitô giáo chiêm niệm (contemplative Christianity), am hiểu sâu sắc các tác phẩm của Eckhart Tolle, Anthony de Mello và Richard Rohr. Bạn cũng là một học giả Kinh Thánh và thần học gia.

NGUYÊN TẮC CỐT LÕI:
- Kinh Thánh là trục chính (primary axis). Các tác giả chiêm niệm chỉ là lăng kính diễn giải (interpretive lenses), KHÔNG PHẢI sự thay thế cho mặc khải (revelation).
- KHÔNG được đánh đồng Kitô giáo với Phật giáo. Chỉ so sánh các trải nghiệm chiêm niệm (contemplative experiences) khi có cơ sở.
- Mỗi diễn giải phải được ghi rõ là DIỄN GIẢI (interpretation), không phải giáo lý (doctrine).

BẠN CẦN TẠO NỘI DUNG THEO KHUNG 7 LỚP SAU (trả lời bằng tiếng Việt):

1. **bibleAnchor** (object):
   - "verses": mảng các câu Kinh Thánh được cung cấp
   - "textVi": toàn văn tiếng Việt của các câu Kinh Thánh đó (trích chính xác từ bản dịch phổ biến)
   - "textEn": toàn văn tiếng Anh (NIV hoặc ESV)

2. **contemplativeReading** (string): Bài đọc chiêm niệm sâu sắc, 600-1000 từ bằng tiếng Việt. Khai mở ý nghĩa tâm linh sâu xa của đoạn Kinh Thánh. Viết bằng giọng văn ấm áp, trầm lắng, chiêm nghiệm.

3. **keywords** (string[]): Các thuật ngữ ý thức/chiêm niệm liên quan (tiếng Việt có kèm tiếng Anh trong ngoặc).

4. **christianContext** (string): Bối cảnh thần học Kitô giáo ngắn gọn, 200-300 từ. Giải thích vị trí của đoạn Kinh Thánh trong truyền thống và lịch sử Kitô giáo.

5. **lensInterpretations** (array): Một phần tử duy nhất với:
   - "author": "${lens}"
   - "content": Diễn giải qua lăng kính của ${authorName}, 400-600 từ bằng tiếng Việt. GHI RÕ đây là diễn giải chiêm niệm, không phải giáo lý chính thức. Trích dẫn cụ thể từ các tác phẩm của ${authorName}.

6. **lifeApplication** (string): Ứng dụng thực tế trong đời sống hàng ngày, 200-400 từ bằng tiếng Việt. Liên hệ với các tình huống: xung đột, tổn thương, công việc, gia đình.

7. **practiceScript** (object):
   - "text": Kịch bản hướng dẫn thực hành chiêm niệm/thiền niệm 5-7 phút bằng tiếng Việt. Bao gồm: mở đầu (chào đón, hít thở), phần chính (hướng dẫn theo từng bước), và kết thúc (quay lại). Viết như đang nói trực tiếp với người nghe.
   - "durationMinutes": số phút (5-7)

TRẢ LỜI BẰNG JSON HỢP LỆ theo đúng cấu trúc trên. Không thêm bất kỳ text nào ngoài JSON.`;
}

// ---------------------------------------------------------------------------
// Slug builder
// ---------------------------------------------------------------------------

function buildSlug(workstream: string, episodeNumber: number, title: string): string {
  const num = String(episodeNumber).padStart(2, "0");
  const titleSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${workstream.toLowerCase()}-${num}-${titleSlug}`;
}

// ---------------------------------------------------------------------------
// Generate one episode
// ---------------------------------------------------------------------------

async function generateOne(def: EpisodeDef): Promise<string> {
  const slug = buildSlug(def.workstream, def.episodeNumber, def.title);

  // Check if already exists
  const existing = await Episode.findOne({ slug });
  if (existing) {
    console.log(`  [SKIP] ${slug} already exists (status: ${existing.status})`);
    return existing._id.toString();
  }

  const userPrompt = `Hãy tạo nội dung cho tập (episode) sau:

- Tiêu đề: ${def.title}
- Workstream: ${def.workstream === "A" ? "A - Kinh Thánh và bản chất thế giới" : "B - Lời dạy từ bi của Đức Giêsu"}
- Số tập: ${def.episodeNumber}
- Các câu Kinh Thánh: ${def.bibleVerses.join(", ")}
- Từ khóa gợi ý: ${def.keywords.join(", ")}
- Lăng kính diễn giải: ${AUTHOR_LABELS[def.lens]}

Hãy trả lời bằng JSON hợp lệ theo đúng khung 7 lớp đã mô tả.`;

  console.log(`  [GEN] Generating ${slug}...`);

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
    if (!content) throw new Error(`Empty response for ${slug}`);
    return content;
  });

  let generated;
  try {
    generated = JSON.parse(rawContent);
  } catch {
    // Try to fix common JSON issues (truncated response)
    const fixed = rawContent.replace(/,\s*}/, "}").replace(/,\s*]/, "]");
    generated = JSON.parse(fixed);
  }

  const episodeData = {
    slug,
    workstream: def.workstream,
    episodeNumber: def.episodeNumber,
    title: def.title,
    bibleAnchor: {
      verses: generated.bibleAnchor?.verses ?? def.bibleVerses,
      textVi: generated.bibleAnchor?.textVi ?? "",
      textEn: generated.bibleAnchor?.textEn ?? "",
    },
    contemplativeReading: generated.contemplativeReading ?? "",
    keywords: generated.keywords ?? def.keywords,
    christianContext: generated.christianContext ?? "",
    lensInterpretations: generated.lensInterpretations ?? [
      { author: def.lens, content: "" },
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

  console.log(`  [OK] Generated ${slug} (id: ${episode._id})`);
  return episode._id.toString();
}

// ---------------------------------------------------------------------------
// Verify one episode
// ---------------------------------------------------------------------------

async function verifyOne(episodeId: string): Promise<void> {
  const episode = await Episode.findById(episodeId);
  if (!episode) throw new Error(`Episode not found: ${episodeId}`);

  if (episode.status === "verified" || episode.status === "published") {
    console.log(`  [SKIP] ${episode.slug} already verified`);
    return;
  }

  console.log(`  [VER] Verifying ${episode.slug}...`);

  const verificationPrompt = `Bạn là một chuyên gia thần học Kitô giáo và học giả Kinh Thánh. Hãy xác minh nội dung sau đây:

TIÊU ĐỀ: ${episode.title}
CÂU KINH THÁNH: ${episode.bibleAnchor.verses.join(", ")}
NỘI DUNG KINH THÁNH (TIẾNG VIỆT): ${episode.bibleAnchor.textVi}

BÀI ĐỌC CHIÊM NIỆM:
${episode.contemplativeReading}

BỐI CẢNH KITÔ GIÁO:
${episode.christianContext}

DIỄN GIẢI:
${episode.lensInterpretations.map((l: { author: string; content: string }) => `[${l.author}]: ${l.content}`).join("\n\n")}

ỨNG DỤNG ĐỜI SỐNG:
${episode.lifeApplication}

HÃY XÁC MINH:
1. Tất cả các câu Kinh Thánh có thực sự tồn tại và được trích dẫn chính xác không?
2. Bối cảnh thần học Kitô giáo có chính xác không?
3. Các diễn giải chiêm niệm có được ghi rõ là DIỄN GIẢI không?
4. Có nội dung nào có thể bị xem là xuyên tạc giáo lý Kitô giáo không?

TRẢ LỜI BẰNG JSON:
{
  "isVerified": boolean,
  "notes": "ghi chú chi tiết bằng tiếng Việt",
  "bibleReferencesChecked": ["danh sách các câu Kinh Thánh đã kiểm tra"]
}`;

  const responseText = await withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: verificationPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const text = result.response.text();
    if (!text) throw new Error(`Empty Gemini response for ${episode.slug}`);
    return text;
  });

  const verification = JSON.parse(responseText);

  await Episode.findByIdAndUpdate(episodeId, {
    $set: {
      verification: {
        isVerified: verification.isVerified,
        notes: verification.notes,
        bibleReferencesChecked: verification.bibleReferencesChecked,
        verifiedAt: new Date(),
      },
      ...(verification.isVerified ? { status: "verified" } : {}),
    },
  });

  console.log(
    `  [${verification.isVerified ? "PASS" : "FAIL"}] ${episode.slug}: ${verification.notes.slice(0, 100)}...`
  );
}

// ---------------------------------------------------------------------------
// Publish verified episodes
// ---------------------------------------------------------------------------

async function publishAll(): Promise<void> {
  const result = await Episode.updateMany(
    { status: "verified" },
    { $set: { status: "published" } }
  );
  console.log(`\n[PUBLISH] Published ${result.modifiedCount} episodes.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  // Step 1: Generate all episodes
  console.log("=== STEP 1: GENERATING EPISODES (ChatGPT) ===\n");
  const ids: string[] = [];

  for (const def of EPISODES) {
    try {
      const id = await generateOne(def);
      ids.push(id);
      // Delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  [ERROR] Failed to generate ${def.workstream}-${def.episodeNumber}: ${err}`);
    }
  }

  console.log(`\nGenerated ${ids.length} episodes.\n`);

  // Step 2: Verify all episodes with Gemini
  console.log("=== STEP 2: VERIFYING EPISODES (Gemini) ===\n");

  for (const id of ids) {
    try {
      await verifyOne(id);
      // Gemini rate limit is tighter (15 RPM)
      await new Promise((r) => setTimeout(r, 6000));
    } catch (err) {
      console.error(`  [ERROR] Failed to verify ${id}: ${err}`);
    }
  }

  // Step 3: Publish all verified
  console.log("\n=== STEP 3: PUBLISHING ===");
  await publishAll();

  // Summary
  const total = await Episode.countDocuments();
  const published = await Episode.countDocuments({ status: "published" });
  const drafts = await Episode.countDocuments({ status: "draft" });
  const verified = await Episode.countDocuments({ status: "verified" });
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${total} | Published: ${published} | Verified: ${verified} | Draft: ${drafts}`);

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
