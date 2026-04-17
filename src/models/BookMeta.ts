import mongoose, { Schema, Document } from "mongoose";

export type BookMetaKey =
  | "intro"
  | "preamble-A"
  | "preamble-B"
  | "preamble-C"
  | "preamble-D"
  | "preamble-E"
  | "conclusion";

export interface IBookMeta extends Document {
  key: BookMetaKey;
  title: string;
  content: string;
  generatedBy: "chatgpt";
  generationModel?: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const BookMetaSchema = new Schema<IBookMeta>(
  {
    key: {
      type: String,
      enum: ["intro", "preamble-A", "preamble-B", "preamble-C", "preamble-D", "preamble-E", "conclusion"],
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    generatedBy: { type: String, enum: ["chatgpt"], default: "chatgpt" },
    generationModel: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.models.BookMeta ||
  mongoose.model<IBookMeta>("BookMeta", BookMetaSchema);
