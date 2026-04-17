import mongoose from "mongoose";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI =
  process.env.MONGODB_URI ??
  "mongodb://localhost:27017/kinhthanh";

const GlossaryTermSchema = new mongoose.Schema(
  {
    termVi: { type: String, required: true, unique: true },
    termEn: { type: String, required: true },
    definition: { type: String, required: true },
    relatedVerses: [{ type: String }],
    category: {
      type: String,
      enum: ["contemplative", "biblical", "mindfulness", "general"],
      default: "general",
    },
    relatedAuthors: [{ type: String, enum: ["tolle", "demello", "rohr"] }],
  },
  { timestamps: true }
);

const GlossaryTerm =
  mongoose.models.GlossaryTerm ??
  mongoose.model("GlossaryTerm", GlossaryTermSchema);

const terms = [
  {
    termVi: "Kenosis (Tự-rỗng)",
    termEn: "Kenosis",
    definition:
      "Sự tự-rỗng, tự hạ mình của Đức Kitô (Pl 2:7). Trong chiêm niệm, đây là con đường buông bỏ bản ngã để mở ra cho ân sủng và sự hiện diện của Thiên Chúa.",
    relatedVerses: ["Pl 2:7"],
    category: "biblical" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Bản ngã (Ego)",
    termEn: "Ego",
    definition:
      'Cái "tôi" giả tạo được xây dựng bởi tâm trí - gồm những câu chuyện, nhãn dán, và đồng nhất hóa với suy nghĩ. Theo Tolle, bản ngã là nguồn gốc của đau khổ không cần thiết.',
    relatedVerses: ["Mt 16:25"],
    category: "mindfulness" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "Hiện diện (Presence)",
    termEn: "Presence",
    definition:
      "Trạng thái tỉnh thức hoàn toàn trong khoảnh khắc hiện tại, không bị cuốn vào dòng suy nghĩ về quá khứ hay tương lai. Trong Kitô giáo, hiện diện liên hệ với sự hiện diện của Thiên Chúa.",
    relatedVerses: ["Cv 17:28", "Mt 6:34"],
    category: "contemplative" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "Phi nhị nguyên (Non-duality)",
    termEn: "Non-duality",
    definition:
      "Cách nhìn vượt lên sự phân chia đúng-sai, trong-ngoài, thánh-tục. Richard Rohr gọi đây là 'mắt chiêm niệm' (contemplative mind) - thấy sự thống nhất trong đa dạng.",
    relatedVerses: ["Gl 3:28", "Cl 3:11"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Tỉnh thức (Awareness/Waking up)",
    termEn: "Awareness / Waking Up",
    definition:
      'Theo Anthony de Mello, tỉnh thức là "thức dậy" khỏi giấc ngủ của điều kiện hóa, ảo tưởng, và phản ứng tự động. "Linh đạo có nghĩa là thức dậy."',
    relatedVerses: ["Ep 5:14", "Rm 13:11"],
    category: "mindfulness" as const,
    relatedAuthors: ["demello" as const],
  },
  {
    termVi: "Từ bi (Compassion)",
    termEn: "Compassion",
    definition:
      'Trong Kitô giáo tỉnh thức, từ bi không chỉ là cảm xúc mà là phẩm tính của ý thức tỉnh thức - "cảm nhận cùng" (com-passion) với người khác, bao gồm cả kẻ thù.',
    relatedVerses: ["Lc 23:34", "Mt 5:44"],
    category: "biblical" as const,
    relatedAuthors: ["tolle" as const, "demello" as const],
  },
  {
    termVi: "Tha thứ (Forgiveness)",
    termEn: "Forgiveness",
    definition:
      'Hành động buông bỏ oán giận và nhu cầu trả đũa. Lời Đức Giêsu "Tha cho họ vì họ không biết việc họ làm" (Lc 23:34) thể hiện từ bi tỉnh thức: thấy vô minh đứng sau hành vi.',
    relatedVerses: ["Lc 23:34", "Mt 18:21-22"],
    category: "biblical" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "Ân sủng (Grace)",
    termEn: "Grace",
    definition:
      "Tình yêu và ơn lành Thiên Chúa ban cho con người cách nhưng không. Trong chiêm niệm, ân sủng được trải nghiệm khi bản ngã buông bỏ quyền kiểm soát và mở ra đón nhận.",
    relatedVerses: ["Ep 2:8-9", "2 Cr 12:9"],
    category: "biblical" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Chiêm niệm (Contemplation)",
    termEn: "Contemplation",
    definition:
      "Hình thức cầu nguyện im lặng, vượt lên lời nói và hình ảnh, nhằm mở ra cho sự hiện diện trực tiếp của Thiên Chúa. Truyền thống chiêm niệm Kitô giáo bao gồm Lectio Divina, Centering Prayer.",
    relatedVerses: ["Tv 46:10", "1 V 19:12"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Agape (Tình yêu vô điều kiện)",
    termEn: "Agape",
    definition:
      "Tình yêu vô điều kiện, không phụ thuộc vào cảm xúc hay phản hồi. Trong chiêm niệm, agape không phải là cảm xúc mà là phẩm tính của tỉnh thức - bản thể của tình yêu.",
    relatedVerses: ["1 Cr 13:4-7", "1 Ga 4:8"],
    category: "biblical" as const,
    relatedAuthors: ["tolle" as const, "rohr" as const],
  },
  {
    termVi: "Điều kiện hóa (Conditioning)",
    termEn: "Conditioning",
    definition:
      "Những khuôn mẫu tư duy, phản ứng, và niềm tin được hình thành từ gia đình, xã hội, văn hóa. De Mello nhấn mạnh rằng hầu hết con người sống trong điều kiện hóa mà không biết.",
    relatedVerses: ["Rm 12:2"],
    category: "mindfulness" as const,
    relatedAuthors: ["demello" as const],
  },
  {
    termVi: "Buông bỏ (Surrender/Letting go)",
    termEn: "Surrender / Letting Go",
    definition:
      "Thái độ không chống lại thực tại hiện tại, không bám víu vào kết quả. Khác với thụ động, buông bỏ là hành động tỉnh thức - chấp nhận 'cái gì đang là' trước khi hành động.",
    relatedVerses: ["Lc 22:42", "Mt 6:10"],
    category: "contemplative" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "Đức Kitô Phổ quát (Universal Christ)",
    termEn: "Universal Christ",
    definition:
      "Khái niệm của Richard Rohr rằng Đức Kitô không chỉ là Giêsu lịch sử mà là mầu nhiệm hiện diện của Thiên Chúa trong toàn bộ tạo vật từ khởi đầu. 'Mọi sự ở trong Đức Kitô' (Cl 1:17).",
    relatedVerses: ["Cl 1:15-17", "Ga 1:1-3"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Nước Trời (Kingdom of God/Heaven)",
    termEn: "Kingdom of God / Heaven",
    definition:
      'Trong đọc chiêm niệm, Nước Trời không chỉ là "đời sau" mà là thực tại sống động ngay đây, ngay bây giờ - chiều kích của sự hiện diện và tình yêu. "Nước Trời đã đến gần" (Mc 1:15).',
    relatedVerses: ["Mc 1:15", "Lc 17:21"],
    category: "biblical" as const,
    relatedAuthors: ["tolle" as const, "rohr" as const],
  },
  {
    termVi: "Thập giá (The Cross)",
    termEn: "The Cross",
    definition:
      "Trong chiêm niệm, thập giá tượng trưng cho 'cái chết của bản ngã' - không phải tự hành xác, mà là buông bỏ sự bám víu vào cái tôi giả tạo để đón nhận đời sống mới.",
    relatedVerses: ["Gl 2:20", "Mt 16:24"],
    category: "biblical" as const,
    relatedAuthors: ["rohr" as const, "tolle" as const],
  },
  {
    termVi: "Phục sinh (Resurrection)",
    termEn: "Resurrection",
    definition:
      'Ngoài ý nghĩa lịch sử, phục sinh trong chiêm niệm là "đời sống mới" - sự biến đổi căn tính khi bản ngã cũ chết đi và con người mới trong Đức Kitô được sinh ra.',
    relatedVerses: ["Rm 6:4", "2 Cr 5:17"],
    category: "biblical" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Vô minh (Ignorance/Unconsciousness)",
    termEn: "Ignorance / Unconsciousness",
    definition:
      'Trạng thái "không biết" - hành động từ bản ngã, phản ứng tự động mà không tỉnh thức. Lời Đức Giêsu "họ không biết việc họ làm" (Lc 23:34) chỉ ra vô minh là gốc rễ của bạo lực.',
    relatedVerses: ["Lc 23:34"],
    category: "mindfulness" as const,
    relatedAuthors: ["tolle" as const, "demello" as const],
  },
  {
    termVi: "Phán xét (Judgment)",
    termEn: "Judgment",
    definition:
      'Cơ chế tự vệ của bản ngã - phân loại, dán nhãn, và kết án người khác. Đức Giêsu dạy "Đừng xét đoán" (Mt 7:1) vì phán xét tạo ra chia rẽ và ngăn cản tình yêu.',
    relatedVerses: ["Mt 7:1-2", "Ga 8:7"],
    category: "mindfulness" as const,
    relatedAuthors: ["demello" as const, "tolle" as const],
  },
  {
    termVi: "Lectio Divina",
    termEn: "Lectio Divina",
    definition:
      "Phương pháp đọc Kinh Thánh chiêm niệm có từ thế kỷ 6, gồm 4 bước: Lectio (đọc), Meditatio (suy niệm), Oratio (cầu nguyện), Contemplatio (chiêm niệm). Mục đích là lắng nghe Lời Chúa bằng trái tim.",
    relatedVerses: ["Tv 119:105"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Centering Prayer (Cầu nguyện trung tâm)",
    termEn: "Centering Prayer",
    definition:
      "Hình thức cầu nguyện im lặng dựa trên truyền thống chiêm niệm Kitô giáo, được phổ biến bởi Thomas Keating. Sử dụng một từ thiêng (sacred word) để quay về sự hiện diện của Thiên Chúa.",
    relatedVerses: ["Mt 6:6"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Tâm trí (Mind/Thinking mind)",
    termEn: "Mind / Thinking Mind",
    definition:
      "Theo Tolle, tâm trí suy nghĩ liên tục (compulsive thinking) là công cụ hữu ích nhưng trở thành vấn đề khi ta đồng nhất hoàn toàn với nó. Lo âu, hối tiếc, phản ứng đều bắt nguồn từ đây.",
    relatedVerses: ["Mt 6:25-34"],
    category: "mindfulness" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "Khoảnh khắc hiện tại (The Now/Present Moment)",
    termEn: "The Now / Present Moment",
    definition:
      'Điểm giao nhau duy nhất giữa con người và thực tại. Tolle gọi là "The Power of Now". Trong Kitô giáo: "Đừng lo lắng về ngày mai" (Mt 6:34).',
    relatedVerses: ["Mt 6:34"],
    category: "mindfulness" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "TA LÀ (I AM)",
    termEn: "I AM",
    definition:
      'Tên Thiên Chúa mặc khải cho Môsê: "Ta là Đấng Ta là" (Xh 3:14). Trong chiêm niệm, "TA LÀ" trước mọi nhãn dán chỉ về hiện hữu thuần túy (pure being), vượt lên mọi đồng nhất hóa.',
    relatedVerses: ["Xh 3:14", "Ga 8:58"],
    category: "biblical" as const,
    relatedAuthors: ["tolle" as const, "rohr" as const],
  },
  {
    termVi: "Dính mắc (Attachment)",
    termEn: "Attachment",
    definition:
      "Sự bám víu của tâm trí vào người, vật, ý tưởng, hoặc kết quả. De Mello dạy rằng dính mắc là nguồn gốc của đau khổ - không phải vì ta yêu, mà vì ta đòi hỏi.",
    relatedVerses: ["Mt 19:21"],
    category: "mindfulness" as const,
    relatedAuthors: ["demello" as const],
  },
  {
    termVi: "Tự do nội tâm (Inner Freedom)",
    termEn: "Inner Freedom",
    definition:
      "Trạng thái không bị điều khiển bởi phản ứng tự động, cảm xúc, hay điều kiện hóa. De Mello: tự do thực sự đến khi ta không còn cần sự chấp thuận, kiểm soát, hay an toàn từ bên ngoài.",
    relatedVerses: ["Ga 8:32", "2 Cr 3:17"],
    category: "mindfulness" as const,
    relatedAuthors: ["demello" as const],
  },
  {
    termVi: "Mầu nhiệm (Mystery)",
    termEn: "Mystery",
    definition:
      "Trong thần học Kitô giáo, mầu nhiệm không phải là điều ta chưa hiểu mà là điều vượt quá khả năng hiểu hoàn toàn của tâm trí. Rohr nhấn mạnh: sống trong mầu nhiệm là sống trong phi nhị nguyên.",
    relatedVerses: ["1 Cr 13:12", "Cl 1:27"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Quan sát (Observation/Witnessing)",
    termEn: "Observation / Witnessing",
    definition:
      "Khả năng nhìn suy nghĩ và cảm xúc mà không đồng nhất với chúng. Tolle gọi đây là 'người quan sát' (the watcher) - bước đầu tiên thoát khỏi sự đồng nhất với bản ngã.",
    relatedVerses: ["Tv 46:10"],
    category: "mindfulness" as const,
    relatedAuthors: ["tolle" as const],
  },
  {
    termVi: "Nghịch lý (Paradox)",
    termEn: "Paradox",
    definition:
      '"Ai muốn giữ mạng sống mình sẽ mất" (Lc 9:24). Kitô giáo đầy nghịch lý: mạnh trong yếu, giàu trong nghèo, sống trong chết. Rohr: nghịch lý là ngôn ngữ của phi nhị nguyên.',
    relatedVerses: ["Lc 9:24", "2 Cr 12:10"],
    category: "contemplative" as const,
    relatedAuthors: ["rohr" as const],
  },
  {
    termVi: "Ảo tưởng (Illusion)",
    termEn: "Illusion",
    definition:
      'De Mello dạy rằng hầu hết niềm tin, nỗi sợ, và mong đợi của ta là ảo tưởng do điều kiện hóa tạo ra. "Tỉnh thức" là thấy rõ các ảo tưởng này mà không phản ứng.',
    relatedVerses: ["Ga 8:32"],
    category: "mindfulness" as const,
    relatedAuthors: ["demello" as const],
  },
  {
    termVi: "Hiền lành (Meekness)",
    termEn: "Meekness",
    definition:
      '"Phước cho ai hiền lành" (Mt 5:5). Hiền lành không phải là yếu đuối mà là sức mạnh nội tâm - không cần kiểm soát, không cần chứng minh, không phản ứng từ bản ngã.',
    relatedVerses: ["Mt 5:5"],
    category: "biblical" as const,
    relatedAuthors: ["tolle" as const],
  },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  console.log(`Seeding ${terms.length} glossary terms...`);

  for (const term of terms) {
    await GlossaryTerm.findOneAndUpdate({ termVi: term.termVi }, { $set: term }, { upsert: true });
  }

  console.log("Done! Seeded glossary terms.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
