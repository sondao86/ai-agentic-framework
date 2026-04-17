# Project Progress: Kitô giáo Tỉnh thức (kinhthanh)

Sách PDF tiếng Việt về Kinh Thánh dưới góc nhìn tỉnh thức.
Tên sách: **"Thế giới – Bản ngã – Từ bi"**
AI pipeline: ChatGPT GPT-4o viết → Gemini 2.5 Flash verify thần học.
Project thuần backend (frontend đã xóa 2026-04-17).

---

## Phase Status

| Phase | Tình trạng | Ghi chú |
|-------|-----------|---------|
| 0 – Bootstrap | ✅ Done | Next.js 16, MongoDB Docker, TypeScript |
| 1 – Data Layer | ✅ Done | Models: Episode, GlossaryTerm, QA, BiblePassage, ScanJob |
| 2 – AI Pipeline | ✅ Done | content-pipeline.ts (GPT-4o → Gemini verify) |
| 3 – UI | ❌ Removed | Frontend xóa — project thuần backend/API |
| 3.5 – Bible Scan | ✅ Done | Scanned Tier1 (Gospels + Pauline), reviewed bằng Gemini |
| 4 – Content Gen | ✅ Done | 18 chương published (A1-A8, B1-B10) |
| **5 – Expand Book** | 🔄 In progress | 53 trang → mục tiêu 340 trang (39 chương, 5 phần) |
| 6 – TTS | ⏳ Pending | Audio cho practiceScript |

---

## Phase 5 — Expand Book (đang làm)

**Mục tiêu:** 39 chương, 5 phần, ~103,500 từ → ~340 trang
**Plan file:** `.claude/plans/temporal-humming-robin.md`

### Tiến độ

| Bước | Mô tả | Tình trạng |
|------|-------|-----------|
| 1 | Data layer: thêm theologicalNote, tạo BookMeta model | ✅ Done (2026-04-17) |
| 2 | `seed/expand-chapters.ts` — regenerate 18 chương cũ | ✅ Done (code written) |
| 3 | `seed/generate-new-chapters.ts` — 21 chương mới | ✅ Done (code written) |
| 4 | `seed/add-book-structure.ts` — khung sách (intro/preambles/kết luận) | ✅ Done (code written) |
| 5 | `seed/export-pdf.ts` — rewrite export không cần web server | ✅ Done (code written) |
| 6 | Chạy toàn bộ + verify output | ⏳ Chưa chạy |

**Bước tiếp theo:** Chạy seed scripts để generate nội dung:
```bash
npx tsx seed/expand-chapters.ts          # ~$4-6, ~30 phút
npx tsx seed/generate-new-chapters.ts   # ~$4-6, ~30 phút
npx tsx seed/add-book-structure.ts       # ~$0.50, ~5 phút
npx tsx seed/export-pdf.ts               # output: ./book.pdf
```

---

## Outline sách — 39 chương, 5 phần

**Phần I — Bản chất thế giới (9 chương, giữ A1-A8 + thêm A9):**
A1 Kenosis · A2 Trong Ngài ta hiện hữu · A3 Đừng lo lắng · A4 Giữ mạng sống sẽ mất
A5 TA LÀ (I AM) · A6 Thập giá · A7 Phục sinh · A8 Agape · A9 Ngôi Lời Nhập Thể (Ga 1:1-14)

**Phần II — Từ bi của Đức Giêsu (11 chương, giữ B1-B10 + thêm B11):**
B1-B10 giữ nguyên · B11 Các Mối Phúc: bản đồ tỉnh thức (Mt 5:3-12)

**Phần III — Cầu nguyện & Tĩnh lặng (7 chương, MỚI):**
C1 Kinh Lạy Cha (Mt 6:9-13) · C2 Dừng lại và nhận biết (Tv 46:10)
C3 Lectio Divina · C4 Đêm tối tâm hồn · C5 Centering Prayer
C6 Giảng Viên: vô thường (Gv 1:2) · C7 Sinh lại từ trên cao (Ga 3:3-8)

**Phần IV — Khổ đau & Ân sủng (6 chương, MỚI):**
D1 Gióp (G 38 + G 42:5) · D2 Ơn Ta đủ cho con (2 Cr 12:9)
D3 Thần Khí rên siết (Rm 8:26) · D4 Đau khổ → kiên nhẫn (Rm 5:3-5)
D5 Sự sống đời đời (Ga 17:3) · D6 Ta là đường (Ga 14:6)

**Phần V — Hiệp nhất & Vũ trụ (6 chương, MỚI):**
E1 Xin cho nên một (Ga 17) · E2 Thân thể Đức Kitô (1 Cr 12)
E3 Universal Christ (Cl 1:27) · E4 Thiên nhiên mặc khải (Tv 19)
E5 Nước hằng sống (Ga 4) · E6 Diễm Ca: tình yêu thần bí (Dc 2:10-13)

**Flow:** I: Mở mắt → II: Ánh sáng → III: Đi sâu → IV: Dark night → V: Phục sinh

---

## Key Files

| File | Mục đích |
|------|---------|
| `src/lib/content-pipeline.ts` | Shared AI generation logic |
| `src/models/Episode.ts` | Schema chương sách |
| `seed/regenerate-as-book.ts` | Script generate gốc (reference) |
| `seed/export-pdf.ts` | Export PDF (inline HTML, no web server) |
| `docs/architecture.md` | Stack, schema, pipeline |
| `tasks/todo.md` | Task checklist chi tiết |
