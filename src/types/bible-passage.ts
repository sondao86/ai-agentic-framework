export type ClassificationCategory =
  | "theGioiQuan"
  | "nhanSinhQuan"
  | "giaTriQuan";

export type ReviewStatus = "pending" | "verified" | "rejected";

export type PriorityTier = 1 | 2 | 3; // 1=content.md, 2=thematic, 3=systematic

export interface Classification {
  category: ClassificationCategory;
  subThemes: string[];
  confidence: number; // 0-1
}

export interface ContemplativePerspective {
  text: string; // 150-300 words Vietnamese
  isInterpretation: true;
}

export interface GeminiReview {
  isVerified: boolean;
  referenceAccurate: boolean;
  classificationReasonable: boolean;
  notes: string;
  reviewedAt: Date;
}

export interface BiblePassageData {
  _id?: string;
  book: string;
  bookVi: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  reference: string; // e.g. "Jn 3:16" or "Jn 3:16-18"
  referenceVi: string; // e.g. "Ga 3,16" or "Ga 3,16-18"
  textVi: string;
  textEn?: string;
  classifications: Classification[];
  contemplativePerspective: ContemplativePerspective;
  review?: GeminiReview;
  reviewStatus: ReviewStatus;
  priorityTier: PriorityTier;
  scanPhase: "priority" | "thematic" | "systematic";
  scanBatchId?: string;
  relatedEpisodeSlugs: string[];
  generatedBy: "chatgpt";
  generationModel: string;
  createdAt?: Date;
  updatedAt?: Date;
}
