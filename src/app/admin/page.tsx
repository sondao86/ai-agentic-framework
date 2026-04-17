import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import Episode from "@/models/Episode";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await dbConnect();

  const [total, workstreamA, workstreamB, draft, verified, published] =
    await Promise.all([
      Episode.countDocuments(),
      Episode.countDocuments({ workstream: "A" }),
      Episode.countDocuments({ workstream: "B" }),
      Episode.countDocuments({ status: "draft" }),
      Episode.countDocuments({ status: "verified" }),
      Episode.countDocuments({ status: "published" }),
    ]);

  const stats = [
    { label: "Tổng số tập", value: total },
    { label: "Dòng A", value: workstreamA, badge: "A" as const },
    { label: "Dòng B", value: workstreamB, badge: "B" as const },
    { label: "Bản nháp", value: draft, badge: "draft" as const },
    { label: "Đã xác minh", value: verified, badge: "verified" as const },
    { label: "Đã xuất bản", value: published, badge: "published" as const },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-sacred-700">
          Tổng quan
        </h1>
        <p className="mt-2 text-sacred-700/70">
          Thống kê nội dung của dự án
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-sacred-700/60">{stat.label}</span>
              {stat.badge && <Badge variant={stat.badge} />}
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-sacred-700">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href="/admin/tao-noi-dung"
          className="inline-flex items-center rounded-lg bg-sacred-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sacred-700"
        >
          Tạo nội dung mới
        </Link>
      </div>
    </div>
  );
}
