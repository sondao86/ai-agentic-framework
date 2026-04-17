import mongoose, { Schema, Document } from "mongoose";
import type { BiblePassageData } from "@/types/bible-passage";

export interface IBiblePassage
  extends Omit<BiblePassageData, "_id">,
    Document {}

const BiblePassageSchema = new Schema<IBiblePassage>(
  {
    book: { type: String, required: true },
    bookVi: { type: String, required: true },
    chapter: { type: Number, required: true },
    verseStart: { type: Number, required: true },
    verseEnd: { type: Number },
    reference: { type: String, required: true, unique: true },
    referenceVi: { type: String, required: true },
    textVi: { type: String, required: true },
    textEn: { type: String },

    classifications: [
      {
        category: {
          type: String,
          enum: ["theGioiQuan", "nhanSinhQuan", "giaTriQuan"],
          required: true,
        },
        subThemes: [{ type: String }],
        confidence: { type: Number, min: 0, max: 1, required: true },
      },
    ],

    contemplativePerspective: {
      text: { type: String, required: true },
      isInterpretation: { type: Boolean, default: true },
    },

    review: {
      isVerified: { type: Boolean },
      referenceAccurate: { type: Boolean },
      classificationReasonable: { type: Boolean },
      notes: { type: String },
      reviewedAt: { type: Date },
    },

    reviewStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    priorityTier: { type: Number, enum: [1, 2, 3], required: true },
    scanPhase: {
      type: String,
      enum: ["priority", "thematic", "systematic"],
      required: true,
    },
    scanBatchId: { type: String },
    relatedEpisodeSlugs: [{ type: String }],
    generatedBy: { type: String, enum: ["chatgpt"], default: "chatgpt" },
    generationModel: { type: String, required: true },
  },
  { timestamps: true }
);

BiblePassageSchema.index({ "classifications.category": 1 });
BiblePassageSchema.index({ book: 1, chapter: 1 });
BiblePassageSchema.index({ reviewStatus: 1 });
BiblePassageSchema.index({ priorityTier: 1 });
BiblePassageSchema.index(
  { textVi: "text", "contemplativePerspective.text": "text" },
  { default_language: "none" }
);

export default mongoose.models.BiblePassage ||
  mongoose.model<IBiblePassage>("BiblePassage", BiblePassageSchema);
