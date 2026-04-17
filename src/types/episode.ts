export type AuthorLens = "tolle" | "demello" | "rohr";
export type Workstream = "A" | "B" | "C" | "D" | "E";
export type EpisodeStatus = "draft" | "verified" | "published";

export interface LensInterpretation {
  author: AuthorLens;
  content: string;
}

export interface BibleAnchor {
  verses: string[];
  textVi: string;
  textEn?: string;
}

export interface PracticeScript {
  text: string;
  durationMinutes: number;
  audioUrl?: string;
  audioGeneratedAt?: Date;
}

export interface Verification {
  isVerified: boolean;
  notes: string;
  bibleReferencesChecked: string[];
  verifiedAt: Date;
}

export interface EpisodeData {
  _id?: string;
  slug: string;
  workstream: Workstream;
  episodeNumber: number;
  title: string;
  bibleAnchor: BibleAnchor;
  // Legacy fields (study-guide format)
  contemplativeReading: string;
  keywords: string[];
  christianContext: string;
  lensInterpretations: LensInterpretation[];
  lifeApplication: string;
  practiceScript: PracticeScript;
  // Book-format fields (optional, preferred over legacy when present)
  partNumber?: number;       // 1 = Workstream A, 2 = Workstream B
  partTitle?: string;        // "Phần I: Kinh Thánh và bản chất thế giới"
  chapterOpening?: string;   // Mở đầu dẫn dắt (250-350 từ)
  chapterBody?: string;      // Essay liền mạch (2000-2800 từ)
  chapterClosing?: string;   // Kết chương + bridge (200-280 từ)
  theologicalNote?: string;  // Bối cảnh Kinh Thánh học ngắn gọn (150-200 từ)
  generatedBy: "chatgpt" | "manual";
  generationModel?: string;
  verification?: Verification;
  status: EpisodeStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
