import mongoose from "mongoose";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";

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

// Mapping: slug -> correct Vietnamese title with diacritics
const TITLE_FIXES: Record<string, string> = {
  "a-01-kenosis-con-duong-rong-de-day-an-sung": "Kenosis: Con đường rỗng để đầy ân sủng",
  "a-02-trong-ngai-ta-hien-huu": "Trong Ngài ta hiện hữu",
  "a-03-dung-lo-lang-ve-ngay-mai": "Đừng lo lắng về ngày mai",
  "a-04-ai-muon-giu-mang-song-minh-se-mat": "Ai muốn giữ mạng sống mình sẽ mất",
  "a-05-ta-la-i-am-hien-huu-vuot-nhan-dan": "TA LÀ (I AM): Hiện hữu vượt nhận dạng",
  "a-06-thap-gia-nhu-cai-chet-cua-cai-toi": "Thập giá như cái chết của cái tôi",
  "a-07-phuc-sinh-nhu-doi-song-moi": "Phục sinh như đời sống mới",
  "a-08-tinh-yeu-nhu-ban-the-agape": "Tình yêu như bản thể (Agape)",
  "b-01-tha-thu-vi-ho-khong-biet": "Tha thứ vì họ không biết",
  "b-02-dung-xet-doan-xet-doan-la-co-che-tu-ve-cua-ban-nga": "Đừng xét đoán: xét đoán là cơ chế tự vệ của bản ngã",
  "b-03-phuoc-cho-ai-hien-lanh": "Phúc cho ai hiền lành",
  "b-04-yeu-ke-thu-ranh-gioi-van-co-nhung-khong-nuoi-thu-han": "Yêu kẻ thù: ranh giới vẫn có nhưng không nuôi thù hận",
  "b-05-khi-bi-tat-mot-ben-ma-khong-phan-ung-vo-thuc": "Khi bị tát một bên má: không phản ứng vô thức",
  "b-06-nguoi-khong-co-toi-nem-da-truoc": "Người không có tội ném đá trước",
  "b-07-dua-con-hoang-dang-long-thuong-xot-vuot-logic-cong-toi": "Đứa con hoang đàng: lòng thương xót vượt logic công tội",
  "b-08-nguoi-samari-nhan-hau-tu-bi-la-hanh-dong-khong-phai-phe-phai": "Người Samari nhân hậu: từ bi là hành động không phải phe phái",
  "b-09-hay-o-lai-trong-thay-o-lai-la-hien-dien": "Hãy ở lại trong Thầy: ở lại là hiện diện",
  "b-10-nuoc-troi-o-gan-gan-la-ngay-day-ngay-luc-nay": "Nước Trời ở gần: gần là ngay đây ngay lúc này",
};

// Also fix keywords to have diacritics
const KEYWORD_FIXES: Record<string, string[]> = {
  "a-01-kenosis-con-duong-rong-de-day-an-sung": ["Kenosis (Tự trút bỏ)", "Tự rỗng (Humility)", "Bản ngã (Ego)", "Ân sủng (Grace)", "Buông bỏ (Letting go)"],
  "a-02-trong-ngai-ta-hien-huu": ["Hiện hữu", "Hiện diện", "Thiên Chúa", "Tỉnh thức"],
  "a-03-dung-lo-lang-ve-ngay-mai": ["Hiện tại", "Lo lắng", "Tâm trí", "Buông bỏ"],
  "a-04-ai-muon-giu-mang-song-minh-se-mat": ["Nghịch lý", "Bản ngã", "Buông bỏ", "Tự do"],
  "a-05-ta-la-i-am-hien-huu-vuot-nhan-dan": ["TA LÀ", "Hiện hữu", "Căn tính", "Phi nhị nguyên"],
  "a-06-thap-gia-nhu-cai-chet-cua-cai-toi": ["Thập giá", "Bản ngã", "Buông bám", "Biến đổi"],
  "a-07-phuc-sinh-nhu-doi-song-moi": ["Phục sinh", "Đổi mới", "Biến đổi", "Căn tính"],
  "a-08-tinh-yeu-nhu-ban-the-agape": ["Agape", "Tình yêu", "Tỉnh thức", "Bản thể"],
  "b-01-tha-thu-vi-ho-khong-biet": ["Tha thứ", "Vô minh", "Từ bi", "Tỉnh thức"],
  "b-02-dung-xet-doan-xet-doan-la-co-che-tu-ve-cua-ban-nga": ["Phán xét", "Bản ngã", "Tự do", "Tỉnh thức"],
  "b-03-phuoc-cho-ai-hien-lanh": ["Hiền lành", "Sức mạnh", "Buông bỏ", "An bình"],
  "b-04-yeu-ke-thu-ranh-gioi-van-co-nhung-khong-nuoi-thu-han": ["Yêu kẻ thù", "Từ bi", "Tha thứ", "Tỉnh thức"],
  "b-05-khi-bi-tat-mot-ben-ma-khong-phan-ung-vo-thuc": ["Không phản ứng", "Tỉnh thức", "Bản ngã", "Tự do"],
  "b-06-nguoi-khong-co-toi-nem-da-truoc": ["Phán xét", "Từ bi", "Đám đông", "Tỉnh thức"],
  "b-07-dua-con-hoang-dang-long-thuong-xot-vuot-logic-cong-toi": ["Thương xót", "Ân sủng", "Bản ngã", "Đổi mới"],
  "b-08-nguoi-samari-nhan-hau-tu-bi-la-hanh-dong-khong-phai-phe-phai": ["Từ bi", "Hành động", "Phe phái", "Tình yêu"],
  "b-09-hay-o-lai-trong-thay-o-lai-la-hien-dien": ["Ở lại", "Hiện diện", "Tỉnh thức", "Kết nối"],
  "b-10-nuoc-troi-o-gan-gan-la-ngay-day-ngay-luc-nay": ["Nước Trời", "Hiện tại", "Tỉnh thức", "Hiện diện"],
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  let updated = 0;
  for (const [slug, newTitle] of Object.entries(TITLE_FIXES)) {
    const updateData: Record<string, unknown> = { title: newTitle };
    if (KEYWORD_FIXES[slug]) {
      updateData.keywords = KEYWORD_FIXES[slug];
    }
    const result = await Episode.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { new: true }
    );
    if (result) {
      console.log(`[OK] ${slug} → "${newTitle}"`);
      updated++;
    } else {
      console.log(`[SKIP] ${slug} not found`);
    }
  }

  console.log(`\nUpdated ${updated} episode titles.`);
  await mongoose.disconnect();
}

main().catch(console.error);
