import mongoose, { Schema, Document } from "mongoose";
import type { ScanJobData } from "@/types/scan-job";

export interface IScanJob extends Omit<ScanJobData, "_id">, Document {}

const ScanJobSchema = new Schema<IScanJob>(
  {
    phase: {
      type: String,
      enum: ["priority", "thematic", "systematic"],
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    description: { type: String, required: true },
    totalItems: { type: Number, required: true, default: 0 },
    processedItems: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    errorMessages: [{ type: String }],
  },
  { timestamps: true }
);

ScanJobSchema.index({ status: 1 });

export default mongoose.models.ScanJob ||
  mongoose.model<IScanJob>("ScanJob", ScanJobSchema);
