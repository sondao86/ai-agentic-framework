import mongoose, { Schema, Document } from "mongoose";
import type { QAData } from "@/types/qa";

export interface IQA extends Omit<QAData, "_id">, Document {}

const QASchema = new Schema<IQA>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    answeredByModel: { type: String, required: true },
    relatedEpisodeSlugs: [{ type: String }],
    relatedVerses: [{ type: String }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QASchema.index(
  { question: "text", answer: "text" },
  { default_language: "none" }
);

export default mongoose.models.QA || mongoose.model<IQA>("QA", QASchema);
