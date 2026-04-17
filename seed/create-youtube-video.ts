/**
 * Create YouTube video from audiobook + cover image + SRT subtitles.
 * Run: npx tsx seed/create-youtube-video.ts
 *
 * Output:
 *   audio/youtube-kenosis.mp4  — video (ready to upload)
 *   audio/subtitles.srt        — upload to YouTube as subtitle track
 */

import puppeteer from "puppeteer";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

import { config } from "dotenv";
config({ path: ".env.local" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AUDIO_FILE = path.resolve(process.cwd(), "audio/book-full.mp3");
const COVER_FILE = path.resolve(process.cwd(), "audio/cover.png");
const OUTPUT_FILE = path.resolve(process.cwd(), "audio/youtube-kenosis.mp4");
const SRT_FILE = path.resolve(process.cwd(), "audio/subtitles.srt");

const COVER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Noto+Sans:wght@300;400&display=swap');

  body {
    width: 1920px;
    height: 1080px;
    background: #0f0e0b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Serif', Georgia, serif;
    overflow: hidden;
  }

  /* Background texture */
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 40%, #1e1a12 0%, #0f0e0b 100%);
  }

  /* Subtle gold lines */
  .lines {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(90deg, transparent 49.9%, rgba(197,168,130,0.04) 50%, transparent 50.1%),
      linear-gradient(0deg, transparent 49.9%, rgba(197,168,130,0.04) 50%, transparent 50.1%);
    background-size: 120px 120px;
  }

  .container {
    position: relative;
    z-index: 10;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* Top label */
  .series-label {
    font-family: 'Noto Sans', sans-serif;
    font-weight: 300;
    font-size: 18px;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #c5a882;
    opacity: 0.7;
    margin-bottom: 40px;
  }

  /* Decorative line */
  .rule-top {
    width: 1px;
    height: 60px;
    background: linear-gradient(to bottom, transparent, #c5a882);
    margin-bottom: 40px;
    opacity: 0.5;
  }

  /* Main title */
  .title {
    font-size: 140px;
    font-weight: 700;
    color: #f0e6d3;
    letter-spacing: 24px;
    line-height: 1;
    text-shadow: 0 0 80px rgba(197,168,130,0.15);
    margin-bottom: 32px;
  }

  /* Gold ornament */
  .ornament {
    font-size: 28px;
    color: #c5a882;
    opacity: 0.6;
    letter-spacing: 20px;
    margin-bottom: 32px;
  }

  /* Subtitle */
  .subtitle {
    font-size: 26px;
    font-weight: 400;
    font-style: italic;
    color: #c5a882;
    letter-spacing: 2px;
    opacity: 0.85;
    margin-bottom: 48px;
  }

  .rule-bottom {
    width: 1px;
    height: 60px;
    background: linear-gradient(to bottom, #c5a882, transparent);
    margin-bottom: 40px;
    opacity: 0.5;
  }

  /* Description */
  .description {
    font-family: 'Noto Sans', sans-serif;
    font-weight: 300;
    font-size: 16px;
    color: #8a7d6b;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* Bible verse */
  .verse {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    font-style: italic;
    font-size: 15px;
    color: #5a5040;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  /* Corner ornaments */
  .corner {
    position: absolute;
    width: 80px;
    height: 80px;
    opacity: 0.2;
  }
  .corner-tl { top: 48px; left: 64px; border-top: 1px solid #c5a882; border-left: 1px solid #c5a882; }
  .corner-tr { top: 48px; right: 64px; border-top: 1px solid #c5a882; border-right: 1px solid #c5a882; }
  .corner-bl { bottom: 48px; left: 64px; border-bottom: 1px solid #c5a882; border-left: 1px solid #c5a882; }
  .corner-br { bottom: 48px; right: 64px; border-bottom: 1px solid #c5a882; border-right: 1px solid #c5a882; }
</style>
</head>
<body>
  <div class="lines"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>

  <div class="container">
    <div class="series-label">Sách Nói · Audiobook</div>
    <div class="rule-top"></div>
    <div class="title">KENOSIS</div>
    <div class="ornament">· · ·</div>
    <div class="subtitle">Thế Giới &nbsp;·&nbsp; Bản Ngã &nbsp;·&nbsp; Từ Bi</div>
    <div class="rule-bottom"></div>
    <div class="description">Đọc Kinh Thánh qua lăng kính tỉnh thức</div>
  </div>

  <div class="verse">"Ngài đã tự hủy mình đi, mặc lấy thân nô lệ." — Philipphê 2:7</div>
</body>
</html>`;

async function createCover() {
  console.log("Creating cover image...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.setContent(COVER_HTML, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1500)); // wait for fonts
  await page.screenshot({ path: COVER_FILE, type: "png" });
  await browser.close();
  console.log(`  → ${COVER_FILE}`);
}

async function createVideo() {
  console.log("Creating YouTube video (this may take a few minutes)...");

  // Get audio duration for progress
  const duration = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${AUDIO_FILE}"`
  ).toString().trim();
  const mins = Math.floor(Number(duration) / 60);
  const secs = Math.round(Number(duration) % 60);
  console.log(`  Audio duration: ${mins}m ${secs}s`);

  // Create MP4: static image + audio, H.264 + AAC, YouTube-optimized
  execSync(
    `ffmpeg -y \
      -loop 1 -framerate 1 -i "${COVER_FILE}" \
      -i "${AUDIO_FILE}" \
      -c:v libx264 -preset slow -crf 18 \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
      -c:a aac -b:a 192k -ar 44100 \
      -pix_fmt yuv420p \
      -movflags +faststart \
      -shortest \
      "${OUTPUT_FILE}"`,
    { stdio: "inherit" }
  );
}

// ---------------------------------------------------------------------------
// Transcribe audio → SRT via Whisper API
// Whisper max file size: 25MB — split if needed
// ---------------------------------------------------------------------------
function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
}

async function generateSRT() {
  if (fs.existsSync(SRT_FILE)) {
    console.log("  [SKIP] subtitles.srt already exists");
    return;
  }

  console.log("Generating subtitles via Whisper...");

  // Split audio into 20-min chunks (Whisper limit: 25MB)
  const CHUNK_DIR = path.join(path.dirname(AUDIO_FILE), "chunks");
  fs.mkdirSync(CHUNK_DIR, { recursive: true });

  execSync(
    `ffmpeg -y -i "${AUDIO_FILE}" -f segment -segment_time 1200 -c copy "${CHUNK_DIR}/chunk-%03d.mp3"`,
    { stdio: "pipe" }
  );

  const chunks = fs.readdirSync(CHUNK_DIR)
    .filter(f => f.startsWith("chunk-") && f.endsWith(".mp3"))
    .sort();

  console.log(`  ${chunks.length} chunks to transcribe (~$${(chunks.length * 20 * 0.006).toFixed(2)} Whisper cost)`);

  let allSegments: { start: number; end: number; text: string }[] = [];
  let timeOffset = 0;

  for (const [i, chunk] of chunks.entries()) {
    const chunkPath = path.join(CHUNK_DIR, chunk);
    console.log(`  [${i+1}/${chunks.length}] Transcribing ${chunk}...`);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath) as any,
      model: "whisper-1",
      language: "vi",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    for (const seg of (response as any).segments ?? []) {
      allSegments.push({
        start: seg.start + timeOffset,
        end: seg.end + timeOffset,
        text: seg.text.trim(),
      });
    }

    // Get chunk duration for offset
    const chunkDur = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${chunkPath}"`).toString().trim()
    );
    timeOffset += chunkDur;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Write SRT
  const srt = allSegments
    .filter(s => s.text)
    .map((s, i) => `${i+1}\n${toSrtTime(s.start)} --> ${toSrtTime(s.end)}\n${s.text}`)
    .join("\n\n");

  fs.writeFileSync(SRT_FILE, srt, "utf-8");

  // Cleanup chunks
  fs.rmSync(CHUNK_DIR, { recursive: true });

  console.log(`  → ${SRT_FILE} (${allSegments.length} segments)`);
}

async function main() {
  await createCover();
  await createVideo();
  await generateSRT();

  const videoSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  console.log(`\n=== DONE ===`);
  console.log(`  Video:     ${OUTPUT_FILE} (${videoSize} MB)`);
  console.log(`  Subtitles: ${SRT_FILE}`);
  console.log(`\nUpload to YouTube:`);
  console.log(`  1. Upload: audio/youtube-kenosis.mp4`);
  console.log(`  Title:     KENOSIS — Thế Giới · Bản Ngã · Từ Bi | Sách Nói Kitô Giáo Chiêm Niệm`);
  console.log(`  2. Subtitles → Upload file → chọn audio/subtitles.srt`);
  console.log(`  3. Language: Vietnamese`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
