# Project Progress: Kitô giáo Tỉnh thức (kinhthanh)

Website + sách PDF tiếng Việt về Kinh Thánh dưới góc nhìn tỉnh thức.
Tên sách: **"Thế giới – Bản ngã – Từ bi"**
AI pipeline: ChatGPT GPT-4o viết → Gemini 2.5 Flash verify thần học.

---

## Phase Status

| Phase | Tình trạng | Ghi chú |
|-------|-----------|---------|
| 0 – Bootstrap | ✅ Done | Next.js 16, MongoDB Docker, TypeScript |
| 1 – Data Layer | ✅ Done | Models: Episode, GlossaryTerm, QA, BiblePassage, ScanJob |
| 2 – AI Pipeline | ✅ Done | content-pipeline.ts (GPT-4o → Gemini verify) |
| 3 – UI | ✅ Done | Trang: tap/, tu-dien/, hoi-dap/, admin/, sach/ |
| 3.5 – Bible Scan | ✅ Done | Scanned Tier1 (Gospels + Pauline), reviewed bằng Gemini |
| 4 – Content Gen | ✅ Done | 18 chương published: A1-A8, B1-B10 |
| **5 – Expand Book** | 🔄 In progress | Sách 53 trang → mục tiêu 150-200 trang |
| 6 – TTS | ⏳ Pending | Audio cho practiceScript |

---

## Phase 5 — Expand Book (đang làm)

**Vấn đề gốc:** max_tokens bị cắt (4096-6000 thay vì 16384) → chapterBody chỉ ~900-1100 từ → 53 trang.

**Kế hoạch đã approve, chưa implement:**

| File | Action | Mô tả |
|------|--------|-------|
| `seed/expand-chapters.ts` | CREATE | Regenerate 18 chương, chapterBody 2000-2800 từ, max_tokens 16384 |
| `seed/add-book-structure.ts` | CREATE | Generate Intro / Part preambles / Kết luận → BookMeta collection |
| `src/models/BookMeta.ts` | CREATE | Model: key (intro/partA/partB/conclusion), content, status |
| `src/app/sach/page.tsx` | MODIFY | Thêm render Intro, preambles, Kết luận, Phụ lục (Glossary) |

---

## Nội dung sách — 18 chương

**Phần I** (A1-A8, lăng kính Tolle/Rohr/de Mello):
A1 Kenosis · A2 Trong Ngài ta hiện hữu · A3 Đừng lo lắng · A4 Ai muốn giữ mạng mình sẽ mất
A5 TA LÀ (I AM) · A6 Thập giá như cái chết của cái tôi · A7 Phục sinh · A8 Tình yêu Agape

**Phần II** (B1-B10):
B1 Tha thứ vì họ không biết · B2 Đừng xét đoán · B3 Phước cho ai hiền lành · B4 Yêu kẻ thù
B5 Tát một bên má · B6 Ai không có tội ném đá trước · B7 Đứa con hoang đàng
B8 Người Samari · B9 Hãy ở lại trong Thầy · B10 Nước Trời ở gần

---

## Key Files

| File | Mục đích |
|------|---------|
| `src/app/sach/page.tsx` | Render sách PDF (SSR, print-optimized) |
| `src/lib/content-pipeline.ts` | Shared AI generation logic |
| `seed/regenerate-as-book.ts` | Script generate gốc (đã dùng) |
| `docs/architecture.md` | Stack, schema, pipeline |
| `tasks/todo.md` | Task checklist chi tiết |
