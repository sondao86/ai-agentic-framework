/**
 * Export full book as PDF — no web server needed.
 * Fetches all content directly from MongoDB, builds HTML inline, renders with Puppeteer.
 * Run: npx tsx seed/export-pdf.ts [--output=./my-book.pdf]
 *
 * Prerequisites: MongoDB must be running (docker compose up -d)
 */

import mongoose from "mongoose";
import puppeteer from "puppeteer";
import path from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "kinhthanh-book.pdf");

// ---------------------------------------------------------------------------
// Mongoose schemas (inline)
// ---------------------------------------------------------------------------

const EpisodeSchema = new mongoose.Schema({
  slug: String,
  workstream: String,
  episodeNumber: Number,
  title: String,
  bibleAnchor: { verses: [String], textVi: String, textEn: String },
  keywords: [String],
  partNumber: Number,
  partTitle: String,
  chapterOpening: String,
  chapterBody: String,
  chapterClosing: String,
  theologicalNote: String,
  contemplativeReading: String,
  practiceScript: { text: String, durationMinutes: Number },
  status: String,
}, { timestamps: true });

const BookMetaSchema = new mongoose.Schema({
  key: String,
  title: String,
  content: String,
  status: String,
});

const GlossarySchema = new mongoose.Schema({
  termVi: String,
  termEn: String,
  definition: String,
  category: String,
});

const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);
const BookMeta = mongoose.models.BookMeta ?? mongoose.model("BookMeta", BookMetaSchema);
const GlossaryTerm = mongoose.models.GlossaryTerm ?? mongoose.model("GlossaryTerm", GlossarySchema);

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paragraphs(text: string): string {
  return (text ?? "")
    .split("\n").filter(l => l.trim())
    .map(l => `<p>${esc(l)}</p>`)
    .join("\n");
}

const PART_LABELS: Record<string, string> = {
  A: "Phần I",
  B: "Phần II",
  C: "Phần III",
  D: "Phần IV",
  E: "Phần V",
};

const PART_THEMES: Record<string, string> = {
  A: "Kinh Thánh và bản chất thế giới",
  B: "Lời dạy từ bi của Đức Giêsu",
  C: "Hành trình nội tâm — Cầu nguyện & Tĩnh lặng",
  D: "Khổ đau, Yếu đuối & Ân sủng",
  E: "Hiệp nhất, Cộng đoàn & Vũ trụ",
};

// ---------------------------------------------------------------------------
// Build HTML
// ---------------------------------------------------------------------------

async function buildHTML(): Promise<string> {
  // Fetch data
  const episodes = await Episode.find({ status: "published" })
    .sort({ workstream: 1, episodeNumber: 1 })
    .lean<any[]>();

  const metaRecords = await BookMeta.find({ status: "published" }).lean<any[]>();
  const meta: Record<string, string> = {};
  for (const r of metaRecords) meta[r.key] = r.content;

  const glossaryTerms = await GlossaryTerm.find({}).sort({ termVi: 1 }).lean<any[]>();

  // Group episodes by workstream
  const byWS: Record<string, any[]> = {};
  for (const ep of episodes) {
    if (!byWS[ep.workstream]) byWS[ep.workstream] = [];
    byWS[ep.workstream].push(ep);
  }

  const workstreams = ["A", "B", "C", "D", "E"].filter(ws => byWS[ws]?.length > 0);

  // Build TOC entries
  const tocEntries = workstreams.map(ws => {
    const chapters = byWS[ws] ?? [];
    return `
      <div class="toc-part">
        <p class="toc-part-label">${esc(PART_LABELS[ws])}: ${esc(PART_THEMES[ws])}</p>
        <ol>
          ${chapters.map(ep => `
            <li>
              <span class="toc-num">${ep.episodeNumber}.</span>
              <span class="toc-title">${esc(ep.title)}</span>
              <span class="toc-verse">${esc(ep.bibleAnchor?.verses?.[0] ?? "")}</span>
            </li>
          `).join("")}
        </ol>
      </div>
    `;
  }).join("");

  // Build chapters
  const chaptersHTML = workstreams.map(ws => {
    const chapters = byWS[ws] ?? [];
    const preambleKey = `preamble-${ws}`;
    const preamble = meta[preambleKey] ?? "";

    return `
      <!-- PART DIVIDER: ${ws} -->
      <div class="part-divider page-break">
        <p class="part-eyebrow">${esc(PART_LABELS[ws])}</p>
        <h2 class="part-title">${esc(PART_THEMES[ws])}</h2>
        ${preamble ? `<div class="part-preamble">${paragraphs(preamble)}</div>` : ""}
      </div>

      ${chapters.map((ep, idx) => {
        const isBookFormat = Boolean(ep.chapterBody);
        const body = isBookFormat ? ep.chapterBody : ep.contemplativeReading;

        return `
          <div class="chapter ${idx > 0 ? "page-break" : ""}">
            <p class="chapter-eyebrow">Chương ${ep.episodeNumber}</p>
            <h2 class="chapter-title">${esc(ep.title)}</h2>
            <p class="chapter-keywords">${(ep.keywords ?? []).map(esc).join(" · ")}</p>

            ${ep.theologicalNote ? `
              <div class="theological-note">
                <p class="note-label">Bối cảnh</p>
                ${paragraphs(ep.theologicalNote)}
              </div>
            ` : ""}

            ${ep.chapterOpening ? `<div class="chapter-opening">${paragraphs(ep.chapterOpening)}</div>` : ""}

            <blockquote class="bible-quote">
              <p class="bible-text">${esc(ep.bibleAnchor?.textVi ?? "")}</p>
              <footer class="bible-ref">${(ep.bibleAnchor?.verses ?? []).map(esc).join("; ")}</footer>
            </blockquote>

            ${body ? `<div class="chapter-body">${paragraphs(body)}</div>` : ""}

            ${ep.chapterClosing ? `<div class="chapter-closing">${paragraphs(ep.chapterClosing)}</div>` : ""}

            ${ep.practiceScript?.text ? `
              <div class="practice-script">
                <p class="practice-label">Thực hành · ${ep.practiceScript.durationMinutes ?? 7} phút</p>
                <div class="practice-text">${paragraphs(ep.practiceScript.text)}</div>
              </div>
            ` : ""}
          </div>
        `;
      }).join("")}
    `;
  }).join("");

  // Glossary
  const glossaryHTML = glossaryTerms.length > 0 ? `
    <div class="glossary page-break">
      <h2 class="glossary-title">Phụ lục: Thuật ngữ</h2>
      ${glossaryTerms.map(term => `
        <div class="glossary-entry">
          <p class="glossary-term">${esc(term.termVi)} <span class="glossary-en">(${esc(term.termEn)})</span></p>
          <p class="glossary-def">${esc(term.definition)}</p>
        </div>
      `).join("")}
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #1a1a1a;
    font-size: 11pt;
    line-height: 1.8;
  }

  .page-break { page-break-before: always; }

  p { margin-bottom: 0.9em; }

  /* Cover */
  .cover {
    text-align: center;
    padding: 120px 60px 100px;
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .cover-series { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 24px; }
  .cover-title { font-size: 32px; font-weight: bold; line-height: 1.25; margin-bottom: 24px; }
  .cover-rule { width: 48px; height: 2px; background: #c5a882; margin: 0 auto 32px; }
  .cover-subtitle { font-size: 14px; color: #666; line-height: 1.7; max-width: 380px; }

  /* Intro */
  .intro { padding: 60px 0; page-break-after: always; }
  .intro h2 { font-size: 20px; margin-bottom: 32px; border-bottom: 1px solid #e0d5c5; padding-bottom: 12px; }
  .intro p { font-size: 11pt; }

  /* TOC */
  .toc { padding: 60px 0; page-break-after: always; }
  .toc h2 { font-size: 20px; margin-bottom: 40px; border-bottom: 1px solid #e0d5c5; padding-bottom: 12px; }
  .toc-part { margin-bottom: 32px; }
  .toc-part-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 12px; }
  .toc-part ol { list-style: none; }
  .toc-part li { display: flex; align-items: baseline; border-bottom: 1px dotted #ddd; padding: 6px 0; font-size: 10.5pt; }
  .toc-num { color: #999; min-width: 24px; flex-shrink: 0; }
  .toc-title { flex: 1; }
  .toc-verse { color: #aaa; font-size: 9pt; margin-left: 12px; white-space: nowrap; }

  /* Part divider */
  .part-divider {
    text-align: center;
    padding: 80px 40px 60px;
    page-break-after: always;
  }
  .part-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #aaa; margin-bottom: 16px; }
  .part-title { font-size: 24px; font-weight: bold; line-height: 1.4; margin-bottom: 40px; }
  .part-preamble { text-align: left; max-width: 560px; margin: 0 auto; font-size: 11pt; color: #444; }
  .part-preamble p { margin-bottom: 0.9em; }

  /* Chapter */
  .chapter { padding-top: 48px; }
  .chapter-eyebrow { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 8px; }
  .chapter-title { font-size: 22px; font-weight: bold; line-height: 1.35; margin-bottom: 8px; }
  .chapter-keywords { font-size: 10pt; color: #aaa; margin-bottom: 32px; }

  /* Theological note */
  .theological-note {
    border-left: 2px solid #d4c4a8;
    padding: 12px 16px;
    margin: 0 0 28px;
    background: #fdf9f4;
    border-radius: 3px;
  }
  .note-label { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #bbb; margin-bottom: 8px; }
  .theological-note p { font-size: 9.5pt; color: #666; line-height: 1.7; margin-bottom: 0.6em; }

  .chapter-opening p { font-size: 11pt; margin-bottom: 0.9em; }
  .chapter-opening { margin-bottom: 28px; }

  /* Bible quote */
  .bible-quote {
    border-left: 3px solid #c5a882;
    padding: 18px 22px;
    margin: 28px 0;
    background: #fdf9f4;
    border-radius: 4px;
  }
  .bible-text { font-style: italic; line-height: 1.8; font-size: 11pt; margin-bottom: 8px; }
  .bible-ref { font-size: 9.5pt; color: #999; }

  .chapter-body p { font-size: 11pt; margin-bottom: 0.9em; }
  .chapter-body { margin-bottom: 28px; }

  .chapter-closing {
    border-top: 1px solid #e8e0d5;
    padding-top: 24px;
    margin-top: 24px;
  }
  .chapter-closing p { font-size: 11pt; font-style: italic; color: #555; margin-bottom: 0.9em; }

  /* Practice script */
  .practice-script {
    margin-top: 40px;
    padding: 18px 22px;
    background: #f7f5f0;
    border-radius: 6px;
    page-break-inside: avoid;
  }
  .practice-label { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 12px; }
  .practice-text p { font-size: 10.5pt; color: #555; margin-bottom: 0.7em; }

  /* Conclusion */
  .conclusion { padding: 60px 0; page-break-before: always; }
  .conclusion h2 { font-size: 20px; margin-bottom: 32px; border-bottom: 1px solid #e0d5c5; padding-bottom: 12px; }
  .conclusion p { font-size: 11pt; }

  /* Glossary */
  .glossary { padding: 60px 0; }
  .glossary-title { font-size: 20px; margin-bottom: 40px; border-bottom: 1px solid #e0d5c5; padding-bottom: 12px; }
  .glossary-entry { margin-bottom: 20px; }
  .glossary-term { font-weight: bold; font-size: 11pt; margin-bottom: 4px; }
  .glossary-en { font-weight: normal; color: #888; font-size: 10pt; }
  .glossary-def { font-size: 10.5pt; color: #444; line-height: 1.7; }

  /* Back matter */
  .back-matter { text-align: center; padding: 120px 0; page-break-before: always; }
  .back-rule { width: 48px; height: 2px; background: #c5a882; margin: 0 auto 32px; }
  .back-quote { font-size: 13pt; color: #888; line-height: 1.8; font-style: italic; }
  .back-ref { margin-top: 12px; font-size: 10pt; color: #bbb; }

  @media print {
    @page {
      size: A4;
      margin: 22mm 24mm 26mm 24mm;
    }
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <p class="cover-series">Kitô giáo Tỉnh thức</p>
  <h1 class="cover-title">Thế giới – Bản ngã – Từ bi</h1>
  <div class="cover-rule"></div>
  <p class="cover-subtitle">Một hành trình chiêm niệm qua Kinh Thánh dưới lăng kính tỉnh thức</p>
</div>

<!-- INTRO -->
${meta["intro"] ? `
<div class="intro page-break">
  <h2>Lời mở đầu</h2>
  ${paragraphs(meta["intro"])}
</div>
` : ""}

<!-- TOC -->
<div class="toc page-break">
  <h2>Mục lục</h2>
  ${tocEntries}
</div>

<!-- CHAPTERS (all parts) -->
${chaptersHTML}

<!-- CONCLUSION -->
${meta["conclusion"] ? `
<div class="conclusion page-break">
  <h2>Kết luận</h2>
  ${paragraphs(meta["conclusion"])}
</div>
` : ""}

<!-- GLOSSARY -->
${glossaryHTML}

<!-- BACK MATTER -->
<div class="back-matter">
  <div class="back-rule"></div>
  <p class="back-quote">"Lạy Cha, xin tha cho họ,<br>vì họ không biết việc họ làm."</p>
  <p class="back-ref">Luca 23:34</p>
</div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const outputPath = args.find(a => a.startsWith("--output="))?.split("=")[1] ?? DEFAULT_OUTPUT;

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  console.log("Building HTML...");
  const html = await buildHTML();

  const epCount = await Episode.countDocuments({ status: "published" });
  const metaCount = await (mongoose.models.BookMeta ?? mongoose.model("BookMeta", BookMetaSchema)).countDocuments();
  console.log(`  Episodes: ${epCount} published`);
  console.log(`  BookMeta: ${metaCount} records`);
  console.log(`  HTML size: ${(html.length / 1024).toFixed(0)} KB\n`);

  await mongoose.disconnect();

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  console.log(`Exporting PDF → ${outputPath}`);
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px; color:#bbb; font-family:Georgia,serif; width:100%; text-align:center; padding-top:6px;">
      Kitô giáo Tỉnh thức — Thế giới · Bản ngã · Từ bi
    </div>`,
    footerTemplate: `<div style="font-size:8px; color:#bbb; font-family:Georgia,serif; width:100%; text-align:center; padding-bottom:6px;">
      <span class="pageNumber"></span>
    </div>`,
    margin: { top: "22mm", right: "24mm", bottom: "26mm", left: "24mm" },
  });

  await browser.close();

  const { statSync } = await import("fs");
  const stats = statSync(outputPath);
  console.log(`\nDone! PDF saved: ${outputPath}`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
