/**
 * Generate TTS audio for the entire book.
 * Run: npx tsx seed/tts-book.ts
 *
 * - Generates audio per chapter (to stay within API limits)
 * - Concatenates into: audio/part-1.mp3, audio/part-2.mp3, audio/book-full.mp3
 * - Uses Gemini 2.5 Flash TTS (Vietnamese voice)
 *
 * Output directory: ./audio/
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import mongoose from "mongoose";
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kinhthanh";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const AUDIO_DIR = path.resolve(process.cwd(), "audio");
const CHAPTERS_DIR = path.join(AUDIO_DIR, "chapters");

// Vietnamese-capable voice options: Aoede, Charon, Fenrir, Kore, Puck
const VOICE = "Aoede";
const TTS_MODEL = "gemini-2.5-pro-preview-tts";
const SAMPLE_RATE = 24000;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const EpisodeSchema = new mongoose.Schema({}, { strict: false });
const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);

// ---------------------------------------------------------------------------
// Build spoken text for a chapter (clean, no markdown)
// ---------------------------------------------------------------------------
function buildSpokenText(ep: Record<string, any>): string {
  const lines: string[] = [];

  // Chapter announcement with pause
  lines.push(`Chương ${ep.episodeNumber}. ${ep.title}.`);
  lines.push(""); // blank line = natural pause

  // Opening
  if (ep.chapterOpening?.trim()) {
    lines.push(ep.chapterOpening.trim());
    lines.push("");
  }

  // Bible verse (spoken as blockquote)
  if (ep.bibleAnchor?.textVi?.trim()) {
    lines.push(ep.bibleAnchor.textVi.trim());
    lines.push(`— ${ep.bibleAnchor.verses?.join(", ") ?? ""}.`);
    lines.push("");
  }

  // Body
  if (ep.chapterBody?.trim()) {
    lines.push(ep.chapterBody.trim());
    lines.push("");
  }

  // Closing
  if (ep.chapterClosing?.trim()) {
    lines.push(ep.chapterClosing.trim());
  }

  return lines.join("\n").replace(/\*\*/g, "").replace(/\*/g, "").replace(/#+\s/g, "");
}

function buildPartAnnouncement(partTitle: string): string {
  return partTitle + ".";
}

// ---------------------------------------------------------------------------
// Call Gemini TTS REST API → returns PCM Buffer
// ---------------------------------------------------------------------------
async function callTTS(text: string): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
        },
      },
    }),
  });

  const data = await res.json() as any;
  if (data.error) throw new Error(`TTS API error: ${JSON.stringify(data.error)}`);

  const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("TTS returned no audio data");

  return Buffer.from(b64, "base64");
}

// ---------------------------------------------------------------------------
// Convert raw PCM to MP3 via ffmpeg
// ---------------------------------------------------------------------------
function pcmToMp3(pcmPath: string, mp3Path: string): void {
  execSync(
    `ffmpeg -y -f s16le -ar ${SAMPLE_RATE} -ac 1 -i "${pcmPath}" -codec:a libmp3lame -b:a 128k "${mp3Path}"`,
    { stdio: "pipe" }
  );
}

// Concatenate list of mp3 files into one
function concatMp3(inputFiles: string[], outputFile: string): void {
  const listFile = outputFile + ".list.txt";
  fs.writeFileSync(listFile, inputFiles.map((f) => `file '${f}'`).join("\n"));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`, { stdio: "pipe" });
  fs.unlinkSync(listFile);
}

// ---------------------------------------------------------------------------
// Retry wrapper
// ---------------------------------------------------------------------------
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 5000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}] ${(err as Error).message} — waiting ${delayMs / 1000}s`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Exhausted retries");
}

// ---------------------------------------------------------------------------
// Generate audio for one chunk of text, save as mp3
// ---------------------------------------------------------------------------
async function generateChunk(text: string, outputMp3: string): Promise<void> {
  if (fs.existsSync(outputMp3)) {
    console.log(`    [SKIP] ${path.basename(outputMp3)} already exists`);
    return;
  }

  const pcmPath = outputMp3 + ".pcm";
  const pcmBuffer = await withRetry(() => callTTS(text));
  fs.writeFileSync(pcmPath, pcmBuffer);
  pcmToMp3(pcmPath, outputMp3);
  fs.unlinkSync(pcmPath);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Setup dirs
  fs.mkdirSync(CHAPTERS_DIR, { recursive: true });

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.\n");

  const episodes = await Episode.find({ status: "published" })
    .sort({ workstream: 1, episodeNumber: 1 })
    .lean() as Record<string, any>[];

  const partA = episodes.filter((e) => e.workstream === "A");
  const partB = episodes.filter((e) => e.workstream === "B");

  const partFiles: { part1: string[]; part2: string[] } = { part1: [], part2: [] };

  for (const [partIdx, { label, chapters }] of [
    ["1", { label: "Phần I: Kinh Thánh và bản chất thế giới", chapters: partA }],
    ["2", { label: "Phần II: Lời dạy từ bi của Đức Giêsu", chapters: partB }],
  ] as [string, { label: string; chapters: Record<string, any>[] }][]) {
    const partKey = partIdx === "1" ? "part1" : "part2";

    console.log(`\n=== ${label} ===`);

    // Part announcement
    const partAnnounceMp3 = path.join(CHAPTERS_DIR, `part-${partIdx}-intro.mp3`);
    console.log(`  [GEN] Part ${partIdx} intro`);
    await generateChunk(buildPartAnnouncement(label), partAnnounceMp3);
    partFiles[partKey].push(partAnnounceMp3);
    await new Promise((r) => setTimeout(r, 1000));

    for (const ep of chapters) {
      const chapterFile = path.join(
        CHAPTERS_DIR,
        `${ep.workstream.toLowerCase()}-${String(ep.episodeNumber).padStart(2, "0")}.mp3`
      );
      const text = buildSpokenText(ep);
      const wordCount = text.split(/\s+/).length;

      console.log(`  [GEN] ${ep.workstream}${ep.episodeNumber}: ${ep.title} (~${wordCount} từ)`);
      await generateChunk(text, chapterFile);
      partFiles[partKey].push(chapterFile);

      // Gemini TTS rate limit: ~10 req/min free tier
      await new Promise((r) => setTimeout(r, 7000));
    }
  }

  // Concatenate Part I
  console.log("\n[CONCAT] Tạo part-1.mp3...");
  const part1Mp3 = path.join(AUDIO_DIR, "part-1.mp3");
  concatMp3(partFiles.part1, part1Mp3);
  console.log(`  → ${part1Mp3} (${(fs.statSync(part1Mp3).size / 1024 / 1024).toFixed(1)} MB)`);

  // Concatenate Part II
  console.log("[CONCAT] Tạo part-2.mp3...");
  const part2Mp3 = path.join(AUDIO_DIR, "part-2.mp3");
  concatMp3(partFiles.part2, part2Mp3);
  console.log(`  → ${part2Mp3} (${(fs.statSync(part2Mp3).size / 1024 / 1024).toFixed(1)} MB)`);

  // Concatenate full book
  console.log("[CONCAT] Tạo book-full.mp3...");
  const fullMp3 = path.join(AUDIO_DIR, "book-full.mp3");
  concatMp3([...partFiles.part1, ...partFiles.part2], fullMp3);
  const fullSize = (fs.statSync(fullMp3).size / 1024 / 1024).toFixed(1);
  console.log(`  → ${fullMp3} (${fullSize} MB)`);

  await mongoose.disconnect();

  console.log("\n=== DONE ===");
  console.log(`Audio files saved to: ${AUDIO_DIR}`);
  console.log(`  audio/part-1.mp3`);
  console.log(`  audio/part-2.mp3`);
  console.log(`  audio/book-full.mp3`);
  console.log(`  audio/chapters/  (18 chapter files)`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
