import { dbConnect } from "@/lib/mongodb";
import QA from "@/models/QA";
import type { QAData } from "@/types/qa";
import QAPageClient from "./QAPageClient";

export const dynamic = "force-dynamic";

export default async function QAPage() {
  await dbConnect();

  const qaList = await QA.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .lean<QAData[]>();

  const serialized = qaList.map((qa) => ({
    ...qa,
    _id: String(qa._id),
    createdAt: qa.createdAt ? new Date(qa.createdAt).toISOString() : undefined,
    updatedAt: qa.updatedAt ? new Date(qa.updatedAt).toISOString() : undefined,
  })) as unknown as QAData[];

  return <QAPageClient initialQAs={serialized} />;
}
