import mongoose, { Schema, Document } from "mongoose";
import type { EpisodeData } from "@/types/episode";

export interface IEpisode extends Omit<EpisodeData, "_id">, Document {}

const EpisodeSchema = new Schema<IEpisode>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    workstream: { type: String, enum: ["A", "B", "C", "D", "E"], required: true, index: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },

    bibleAnchor: {
      verses: [{ type: String }],
      textVi: { type: String, required: true },
      textEn: { type: String },
    },

    contemplativeReading: { type: String, required: true },
    keywords: [{ type: String }],
    christianContext: { type: String, required: true },

    lensInterpretations: [
      {
        author: {
          type: String,
          enum: ["tolle", "demello", "rohr"],
          required: true,
        },
        content: { type: String, required: true },
      },
    ],

    lifeApplication: { type: String, required: true },

    // Book-format fields
    partNumber: { type: Number },
    partTitle: { type: String },
    chapterOpening: { type: String },
    chapterBody: { type: String },
    chapterClosing: { type: String },
    theologicalNote: { type: String },

    practiceScript: {
      text: { type: String, required: true },
      durationMinutes: { type: Number, required: true, min: 3, max: 12 },
      audioUrl: { type: String },
      audioGeneratedAt: { type: Date },
    },

    generatedBy: {
      type: String,
      enum: ["chatgpt", "manual"],
      default: "chatgpt",
    },
    generationModel: { type: String },

    verification: {
      isVerified: { type: Boolean },
      notes: { type: String },
      bibleReferencesChecked: [{ type: String }],
      verifiedAt: { type: Date },
    },

    status: {
      type: String,
      enum: ["draft", "verified", "published"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

EpisodeSchema.index({ workstream: 1, episodeNumber: 1 });

export default mongoose.models.Episode ||
  mongoose.model<IEpisode>("Episode", EpisodeSchema);
