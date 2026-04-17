import mongoose, { Schema, Document } from "mongoose";
import type { GlossaryTermData } from "@/types/glossary";

export interface IGlossaryTerm
  extends Omit<GlossaryTermData, "_id">,
    Document {}

const GlossaryTermSchema = new Schema<IGlossaryTerm>(
  {
    termVi: { type: String, required: true, unique: true, index: true },
    termEn: { type: String, required: true, index: true },
    definition: { type: String, required: true },
    relatedVerses: [{ type: String }],
    category: {
      type: String,
      enum: ["contemplative", "biblical", "mindfulness", "general"],
      default: "general",
      index: true,
    },
    relatedAuthors: [
      { type: String, enum: ["tolle", "demello", "rohr"] },
    ],
  },
  { timestamps: true }
);

GlossaryTermSchema.index(
  { termVi: "text", termEn: "text", definition: "text" },
  { default_language: "none" }
);

export default mongoose.models.GlossaryTerm ||
  mongoose.model<IGlossaryTerm>("GlossaryTerm", GlossaryTermSchema);
