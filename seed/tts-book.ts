/**
 * Generate TTS audio for the full book — all 5 parts, 39 chapters.
 * Voice: Charon (Gemini TTS — deep male, calm, suited for contemplative narration)
 *
 * Run: npx tsx seed/tts-book.ts [--ws=A|B|C|D|E] [--force]
 *
 * Output structure:
 *   audio/chapters/{ws}-{nn}.mp3   — per chapter
 *   audio/parts/part-{1-5}.mp3     — per part (concatenated)
 *   audio/book-full.mp3            — full book
 *
 * Prerequisites: ffmpeg installed, GEMINI_API_KEY in .env.local
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
const PARTS_DIR = path.join(AUDIO_DIR, "parts");

const VOICE = "Charon";           // Deep male — calm, resonant, perfect for spiritual narration
const TTS_MODEL = "gemini-2.5-pro-preview-tts";
const SAMPLE_RATE = 24000;

const PART_LABELS: Record<string, { number: number; title: string }> = {
  A: { number: 1, title: "Phần I: Kinh Thánh và bản chất thế giới" },
  B: { number: 2, title: "Phần II: Lời dạy từ bi của Đức Giêsu" },
  C: { number: 3, title: "Phần III: Hành trình nội tâm — Cầu nguyện và Tĩnh lặng" },
  D: { number: 4, title: "Phần IV: Khổ đau, Yếu đuối và Ân sủng" },
  E: { number: 5, title: "Phần V: Hiệp nhất, Cộng đoàn và Vũ trụ" },
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const EpisodeSchema = new mongoose.Schema({}, { strict: false });
const BookMetaSchema = new mongoose.Schema({}, { strict: false });
const Episode = mongoose.models.Episode ?? mongoose.model("Episode", EpisodeSchema);
const BookMeta = mongoose.models.BookMeta ?? mongoose.model("BookMeta", BookMetaSchema);

// ---------------------------------------------------------------------------
// Build spoken text
// ---------------------------------------------------------------------------

function clean(text: string): string {
  return (text ?? "")
    .replace(/\*\*/g, "").replace(/\*/g, "").replace(/#+\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildChapterText(ep: Record<string, any>): string {
  const parts: string[] = [];

  parts.push(`Chương ${ep.episodeNumber}. ${ep.title}.`);
  parts.push("");

  if (ep.chapterOpening?.trim()) {
    parts.push(clean(ep.chapterOpening));
    parts.push("");
  }

  if (ep.bibleAnchor?.verses?.length) {
    parts.push(`— ${ep.bibleAnchor.verses.join(", ")} —`);
    parts.push("");
  }

  if (ep.chapterBody?.trim()) {
    parts.push(clean(ep.chapterBody));
    parts.push("");
  }

  if (ep.chapterClosing?.trim()) {
    parts.push(clean(ep.chapterClosing));
  }

  return parts.join("\n");
}

function buildPracticeText(ep: Record<string, any>): string {
  if (!ep.practiceScript?.text?.trim()) return "";
  return [
    `Thực hành. Chương ${ep.episodeNumber}: ${ep.title}.`,
    "",
    clean(ep.practiceScript.text),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Split long text into chunks ≤ 4500 chars (Gemini TTS limit)
// Split at paragraph boundaries
// ---------------------------------------------------------------------------

function splitIntoChunks(text: string, maxChars = 4500): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      // If single paragraph > maxChars, split by sentences
      if (para.length > maxChars) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
        let sentChunk = "";
        for (const s of sentences) {
          if ((sentChunk + s).length <= maxChars) {
            sentChunk += s;
          } else {
            if (sentChunk) chunks.push(sentChunk.trim());
            sentChunk = s;
          }
        }
        if (sentChunk) current = sentChunk;
        else current = "";
      } else {
        current = para;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

// ---------------------------------------------------------------------------
// Gemini TTS API call → PCM Buffer
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

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  if (data.error) throw new Error(`TTS error: ${JSON.stringify(data.error)}`);

  const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("TTS returned no audio data");

  return Buffer.from(b64, "base64");
}

// PCM → MP3 via ffmpeg
function pcmToMp3(pcmPath: string, mp3Path: string): void {
  execSync(
    `ffmpeg -y -f s16le -ar ${SAMPLE_RATE} -ac 1 -i "${pcmPath}" -codec:a libmp3lame -b:a 128k "${mp3Path}"`,
    { stdio: "pipe" }
  );
}

// Concatenate MP3 files via ffmpeg
function concatMp3(inputFiles: string[], outputFile: string): void {
  if (inputFiles.length === 0) return;
  if (inputFiles.length === 1) {
    fs.copyFileSync(inputFiles[0], outputFile);
    return;
  }
  const listFile = outputFile + ".list.txt";
  fs.writeFileSync(listFile, inputFiles.map(f => `file '${f}'`).join("\n"));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`, { stdio: "pipe" });
  fs.unlinkSync(listFile);
}

// ---------------------------------------------------------------------------
// Generate audio for a text → mp3 (handles chunking)
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 8000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`    [RETRY ${i + 1}/${retries}] ${(err as Error).message}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Exhausted retries");
}

async function generateAudio(text: string, outputMp3: string, force = false): Promise<void> {
  if (!force && fs.existsSync(outputMp3)) {
    console.log(`    [SKIP] ${path.basename(outputMp3)}`);
    return;
  }

  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) { console.log(`    [SKIP] empty text`); return; }

  if (chunks.length === 1) {
    const pcmPath = outputMp3 + ".pcm";
    const pcm = await withRetry(() => callTTS(chunks[0]));
    fs.writeFileSync(pcmPath, pcm);
    pcmToMp3(pcmPath, outputMp3);
    fs.unlinkSync(pcmPath);
  } else {
    // Generate each chunk then concat
    const chunkFiles: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkMp3 = outputMp3 + `.chunk${i}.mp3`;
      const pcmPath = chunkMp3 + ".pcm";
      const pcm = await withRetry(() => callTTS(chunks[i]));
      fs.writeFileSync(pcmPath, pcm);
      pcmToMp3(pcmPath, chunkMp3);
      fs.unlinkSync(pcmPath);
      chunkFiles.push(chunkMp3);
      await new Promise(r => setTimeout(r, 2000));
    }
    concatMp3(chunkFiles, outputMp3);
    chunkFiles.forEach(f => fs.unlinkSync(f));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const wsFilter = args.find(a => a.startsWith("--ws="))?.split("=")[1];
  const force = args.includes("--force");

  fs.mkdirSync(CHAPTERS_DIR, { recursive: true });
  fs.mkdirSync(PARTS_DIR, { recursive: true });

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected. Voice: ${VOICE} (male)\n`);

  // Load BookMeta for intro/preambles/conclusion
  const metaRecords = await BookMeta.find({}).lean() as any[];
  const meta: Record<string, string> = {};
  for (const r of metaRecords) meta[r.key] = r.content ?? "";

  const allEpisodes = await Episode.find({ status: "published" })
    .sort({ workstream: 1, episodeNumber: 1 })
    .lean() as Record<string, any>[];

  const workstreams = ["A", "B", "C", "D", "E"].filter(ws => !wsFilter || ws === wsFilter);

  // Track all per-part files for final concat
  const partMp3Files: Record<string, string[]> = {};

  // --- Intro ---
  if (!wsFilter && meta["intro"]) {
    const introFile = path.join(PARTS_DIR, "intro.mp3");
    console.log(`[GEN] Lời mở đầu`);
    await generateAudio(`Lời mở đầu.\n\n${clean(meta["intro"])}`, introFile, force);
    console.log(`  → intro.mp3`);
    await new Promise(r => setTimeout(r, 3000));
  }

  for (const ws of workstreams) {
    const part = PART_LABELS[ws];
    const episodes = allEpisodes.filter(e => e.workstream === ws);
    if (episodes.length === 0) continue;

    const partFiles: string[] = [];
    console.log(`\n=== ${part.title} (${episodes.length} chương) ===`);

    // Part preamble
    const preambleKey = `preamble-${ws}`;
    const preamble = meta[preambleKey];
    if (preamble) {
      const preambleFile = path.join(PARTS_DIR, `preamble-${ws.toLowerCase()}.mp3`);
      console.log(`  [GEN] Dẫn nhập ${part.title}`);
      await generateAudio(`${part.title}.\n\n${clean(preamble)}`, preambleFile, force);
      partFiles.push(preambleFile);
      await new Promise(r => setTimeout(r, 3000));
    }

    // Chapters
    for (const ep of episodes) {
      const fileName = `${ep.workstream.toLowerCase()}-${String(ep.episodeNumber).padStart(2, "0")}.mp3`;
      const chapterFile = path.join(CHAPTERS_DIR, fileName);
      const text = buildChapterText(ep);
      const words = text.split(/\s+/).length;

      console.log(`  [GEN] ${ep.workstream}${ep.episodeNumber}: ${ep.title} (~${words} từ)`);
      await generateAudio(text, chapterFile, force);
      partFiles.push(chapterFile);

      // Practice script as separate file
      const practiceText = buildPracticeText(ep);
      if (practiceText) {
        const practiceFile = path.join(CHAPTERS_DIR, fileName.replace(".mp3", "-practice.mp3"));
        await generateAudio(practiceText, practiceFile, force);
      }

      // Rate limit: ~10 req/min on Gemini free tier
      await new Promise(r => setTimeout(r, 7000));
    }

    // Concat part
    const partMp3 = path.join(PARTS_DIR, `part-${part.number}.mp3`);
    console.log(`\n  [CONCAT] → part-${part.number}.mp3`);
    concatMp3(partFiles, partMp3);
    const sizeMB = (fs.statSync(partMp3).size / 1024 / 1024).toFixed(1);
    console.log(`  → ${partMp3} (${sizeMB} MB)`);

    partMp3Files[ws] = partFiles;
  }

  // --- Conclusion ---
  if (!wsFilter && meta["conclusion"]) {
    const conclusionFile = path.join(PARTS_DIR, "conclusion.mp3");
    console.log(`\n[GEN] Kết luận`);
    await generateAudio(`Kết luận.\n\n${clean(meta["conclusion"])}`, conclusionFile, force);
    console.log(`  → conclusion.mp3`);
  }

  // --- Full book concat ---
  if (!wsFilter) {
    const allFiles: string[] = [];

    const introFile = path.join(PARTS_DIR, "intro.mp3");
    if (fs.existsSync(introFile)) allFiles.push(introFile);

    for (const ws of ["A", "B", "C", "D", "E"]) {
      const preambleFile = path.join(PARTS_DIR, `preamble-${ws.toLowerCase()}.mp3`);
      if (fs.existsSync(preambleFile)) allFiles.push(preambleFile);

      const chapterFiles = allEpisodes
        .filter(e => e.workstream === ws)
        .map(ep => path.join(CHAPTERS_DIR, `${ep.workstream.toLowerCase()}-${String(ep.episodeNumber).padStart(2, "0")}.mp3`))
        .filter(f => fs.existsSync(f));
      allFiles.push(...chapterFiles);
    }

    const conclusionFile = path.join(PARTS_DIR, "conclusion.mp3");
    if (fs.existsSync(conclusionFile)) allFiles.push(conclusionFile);

    if (allFiles.length > 0) {
      const fullMp3 = path.join(AUDIO_DIR, "book-full.mp3");
      console.log(`\n[CONCAT] Tạo book-full.mp3 (${allFiles.length} files)...`);
      concatMp3(allFiles, fullMp3);
      const sizeMB = (fs.statSync(fullMp3).size / 1024 / 1024).toFixed(1);
      console.log(`  → book-full.mp3 (${sizeMB} MB)`);
    }
  }

  await mongoose.disconnect();

  console.log(`\n=== DONE ===`);
  console.log(`Audio files: ${AUDIO_DIR}`);
  console.log(`  parts/        — per-part MP3`);
  console.log(`  chapters/     — per-chapter MP3`);
  console.log(`  book-full.mp3 — full audiobook`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
