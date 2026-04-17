/**
 * Export full book as PDF with table of contents.
 * Run: npx tsx seed/export-pdf.ts
 *
 * Prerequisites: Next.js dev server must be running (npm run dev)
 * Output: kinhthanh-book.pdf in project root
 */

import puppeteer from "puppeteer";
import path from "path";

const BASE_URL = process.env.NEXT_URL ?? "http://localhost:3000";
const OUTPUT_PATH = path.resolve(process.cwd(), "kinhthanh-book.pdf");

async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport for A4
  await page.setViewport({ width: 794, height: 1123 });

  console.log(`Navigating to ${BASE_URL}/sach ...`);
  await page.goto(`${BASE_URL}/sach`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // Inject print-specific CSS
  await page.addStyleTag({
    content: `
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page {
        size: A4;
        margin: 20mm 22mm 24mm 22mm;
      }
      body { margin: 0 !important; padding: 0 !important; }
      /* Page numbers via CSS counters */
      @page { @bottom-center { content: counter(page); font-size: 11px; color: #aaa; font-family: Georgia, serif; } }
    `,
  });

  console.log("Generating PDF...");
  await page.pdf({
    path: OUTPUT_PATH,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:9px; color:#aaa; font-family:Georgia,serif; width:100%; text-align:center; padding-top:6px;">
      Kitô giáo Tỉnh thức — Thế giới · Bản ngã · Từ bi
    </div>`,
    footerTemplate: `<div style="font-size:9px; color:#aaa; font-family:Georgia,serif; width:100%; text-align:center; padding-bottom:6px;">
      <span class="pageNumber"></span>
    </div>`,
    margin: { top: "20mm", right: "22mm", bottom: "24mm", left: "22mm" },
  });

  await browser.close();

  console.log(`\nPDF saved to: ${OUTPUT_PATH}`);

  // Check file size
  const { statSync } = await import("fs");
  const stats = statSync(OUTPUT_PATH);
  const mb = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`File size: ${mb} MB`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  console.error("\nMake sure Next.js dev server is running: npm run dev");
  process.exit(1);
});
