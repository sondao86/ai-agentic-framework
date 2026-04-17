export type ScanPhase = "priority" | "thematic" | "systematic";
export type ScanJobStatus = "queued" | "running" | "completed" | "failed";

export interface ScanJobData {
  _id?: string;
  phase: ScanPhase;
  status: ScanJobStatus;
  description: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  errorMessages: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
