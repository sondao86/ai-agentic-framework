/**
 * Generate book structural content: intro, part preambles, conclusion.
 * Saves to BookMeta collection.
 * Run: npx tsx seed/add-book-structure.ts
 */

import mongoose from "mongoose";
import OpenAI from "openai";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 2 });

const BookMetaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    generatedBy: { type: String, default: "chatgpt" },
    generationModel: String,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

const BookMeta = mongoose.models.BookMeta ?? mongoose.model("BookMeta", BookMetaSchema);

// ---------------------------------------------------------------------------
// Structural content definitions
// ---------------------------------------------------------------------------

interface StructureDef {
  key: string;
  title: string;
  prompt: string;
  targetWords: number;
}

const STRUCTURE_ITEMS: StructureDef[] = [
  {
    key: "intro",
    title: "Lời mở đầu",
    targetWords: 800,
    prompt: `Viết "Lời mở đầu" (~800 từ) cho cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi".

Nội dung cần có:
1. Câu hỏi mở: tại sao đọc Kinh Thánh dưới góc nhìn tỉnh thức?
2. Giới thiệu ngắn ba tác giả lăng kính: Eckhart Tolle (Hiện diện/Bản ngã), Anthony de Mello (Thức tỉnh/Ảo tưởng), Richard Rohr (Phi nhị nguyên/Đức Kitô vũ trụ)
3. Nguyên tắc: Kinh Thánh là trục chính, ba tác giả là lăng kính — không đồng nhất Kitô giáo với Phật giáo
4. Hướng dẫn đọc sách: đọc chậm, đọc cùng thực hành, không cần đọc theo thứ tự
5. Lời mời: cuốn sách như một người bạn đồng hành trên hành trình

Giọng văn: ấm áp, thân mật, không học thuật. Viết thuần văn xuôi, không bullet points.`,
  },
  {
    key: "preamble-A",
    title: "Dẫn nhập Phần I",
    targetWords: 450,
    prompt: `Viết "Dẫn nhập Phần I" (~450 từ) cho phần "Kinh Thánh và bản chất thế giới" của sách chiêm niệm Kitô giáo.

Phần I gồm 9 chương khám phá: Kenosis, Trong Ngài ta hiện hữu, Đừng lo lắng, Ai muốn giữ mạng sống, TA LÀ (I AM), Thập giá như cái chết của cái tôi, Phục sinh, Tình yêu Agape, Ngôi Lời Nhập Thể.

Nội dung dẫn nhập:
- Câu hỏi trung tâm: Kinh Thánh nói gì về bản chất thực của thế giới và con người?
- Chủ đề xuyên suốt: buông bỏ bản ngã như cửa vào tự do
- Giới thiệu ngắn hành trình 9 chương sẽ đi

Viết thuần văn xuôi, kết bằng một câu mời gọi vào hành trình.`,
  },
  {
    key: "preamble-B",
    title: "Dẫn nhập Phần II",
    targetWords: 450,
    prompt: `Viết "Dẫn nhập Phần II" (~450 từ) cho phần "Lời dạy từ bi của Đức Giêsu".

Phần II gồm 11 chương: Tha thứ vì họ không biết, Đừng xét đoán, Phước cho ai hiền lành, Yêu kẻ thù, Không phản ứng vô thức, Ném đá trước, Đứa con hoang đàng, Người Samari, Hãy ở lại, Nước Trời ở gần, Các Mối Phúc.

Nội dung:
- Từ bi không phải là cảm xúc mà là phẩm tính của tỉnh thức
- Đức Giêsu dạy "thức tỉnh" qua hành động cụ thể
- Liên kết với Phần I: nếu Phần I là "thấy rõ bản thân", Phần II là "sống từ chỗ đó ra ngoài"

Viết thuần văn xuôi, kết bằng câu mời gọi.`,
  },
  {
    key: "preamble-C",
    title: "Dẫn nhập Phần III",
    targetWords: 450,
    prompt: `Viết "Dẫn nhập Phần III" (~450 từ) cho phần "Hành trình nội tâm — Cầu nguyện & Tĩnh lặng".

Phần III gồm 7 chương: Kinh Lạy Cha, Hãy dừng lại (Tv 46:10), Lectio Divina, Đêm tối tâm hồn, Centering Prayer, Giảng Viên (vô thường), Sinh lại từ trên cao (Ga 3).

Nội dung:
- Chuyển tiếp từ "hiểu" (Phần I-II) sang "thực hành" (Phần III)
- Cầu nguyện không phải xin Chúa làm gì, mà là lắng nghe và hiện diện
- Các hình thức chiêm niệm trong Kitô giáo như công cụ tỉnh thức

Viết thuần văn xuôi, kết bằng câu mời gọi thực hành.`,
  },
  {
    key: "preamble-D",
    title: "Dẫn nhập Phần IV",
    targetWords: 450,
    prompt: `Viết "Dẫn nhập Phần IV" (~450 từ) cho phần "Khổ đau, Yếu đuối & Ân sủng".

Phần IV gồm 6 chương: Gióp, Ơn Ta đủ cho con, Thần Khí rên siết, Đau khổ → kiên nhẫn, Sự sống đời đời, Ta là đường.

Nội dung:
- Đây là phần "đêm tối" của sách — không thể né tránh khổ đau trong hành trình tâm linh
- Nghịch lý Kitô giáo: yếu đuối là nơi ân sủng tỏa sáng
- Khổ đau không phải hình phạt mà là cửa vào biến đổi
- Tone: trầm lắng, đồng hành, không sáo rỗng

Viết thuần văn xuôi, kết bằng câu mời gọi trung thực với khổ đau của mình.`,
  },
  {
    key: "preamble-E",
    title: "Dẫn nhập Phần V",
    targetWords: 450,
    prompt: `Viết "Dẫn nhập Phần V" (~450 từ) cho phần "Hiệp nhất, Cộng đoàn & Vũ trụ".

Phần V gồm 6 chương: Xin cho tất cả nên một (Ga 17), Thân thể Đức Kitô, Universal Christ, Thiên nhiên như mặc khải, Nước hằng sống, Diễm Ca.

Nội dung:
- Sau hành trình nội tâm và qua đêm tối, tỉnh thức mở rộng ra ngoài bản thân
- Từ "tôi" sang "chúng ta" sang "tất cả"
- Đức Kitô không chỉ trong Kinh Thánh mà trong vạn vật (Rohr - Universal Christ)
- Đây là phần climax — cảm giác hoàn thành và hòa nhập

Viết thuần văn xuôi, kết bằng câu mời gọi nhìn thế giới bằng mắt tỉnh thức.`,
  },
  {
    key: "conclusion",
    title: "Kết luận",
    targetWords: 700,
    prompt: `Viết "Kết luận" (~700 từ) cho cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi".

Nội dung:
1. Nhìn lại hành trình 5 phần: Mở mắt (I) → Ánh sáng (II) → Đi sâu (III) → Đêm tối (IV) → Phục sinh (V)
2. Hành trình tỉnh thức không có điểm đến — nó là cách sống từng ngày
3. Ba lăng kính Tolle/de Mello/Rohr như ba người thầy đồng hành
4. Kinh Thánh vẫn còn nhiều điều chưa khám phá — lời mời tiếp tục
5. Kết bằng một lời cầu nguyện ngắn (4-6 câu) — giọng nhẹ nhàng, mở

Giọng văn: ấm, chân thành, không kết luận quá cứng. Viết thuần văn xuôi.`,
  },
];

// ---------------------------------------------------------------------------
// Generate one structural item
// ---------------------------------------------------------------------------

async function generateStructure(item: StructureDef): Promise<void> {
  console.log(`  [GEN] ${item.key}: ${item.title}`);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Bạn là tác giả của cuốn sách chiêm niệm Kitô giáo "Kitô giáo Tỉnh thức: Thế giới – Bản ngã – Từ bi". Viết các phần cấu trúc sách bằng tiếng Việt với giọng văn ấm áp, trầm lắng, như người bạn đồng hành. KHÔNG dùng bullet points hay headers trong nội dung. Chỉ trả lời nội dung thuần văn xuôi, không thêm tiêu đề hay giải thích.`,
      },
      { role: "user", content: item.prompt },
    ],
    temperature: 0.75,
    max_tokens: 4096,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error(`Empty response for ${item.key}`);

  await BookMeta.findOneAndUpdate(
    { key: item.key },
    {
      $set: {
        key: item.key,
        title: item.title,
        content,
        generatedBy: "chatgpt",
        generationModel: "gpt-4o",
        status: "published",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const wordCount = content.split(/\s+/).length;
  console.log(`  [OK] ${item.key} — ${wordCount} từ`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const keyFilter = args.find(a => a.startsWith("--key="))?.split("=")[1];

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const toProcess = STRUCTURE_ITEMS.filter(i => !keyFilter || i.key === keyFilter);
  console.log(`=== GENERATING ${toProcess.length} STRUCTURAL SECTIONS ===\n`);

  for (const item of toProcess) {
    try {
      await generateStructure(item);
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  [ERROR] ${item.key}: ${err}`);
    }
  }

  const count = await BookMeta.countDocuments();
  console.log(`\nDone. BookMeta records: ${count}`);

  await mongoose.disconnect();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
