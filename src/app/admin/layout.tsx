import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-sacred-200 bg-sacred-700">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white">
              Khu vực Quản trị
            </span>
            <nav className="flex items-center gap-3">
              <Link
                href="/admin"
                className="rounded px-2 py-1 text-xs text-sacred-200 hover:bg-sacred-500/30 hover:text-white transition-colors"
              >
                Tổng quan
              </Link>
              <Link
                href="/admin/tao-noi-dung"
                className="rounded px-2 py-1 text-xs text-sacred-200 hover:bg-sacred-500/30 hover:text-white transition-colors"
              >
                Tạo nội dung
              </Link>
            </nav>
          </div>
          <Link
            href="/"
            className="text-xs text-sacred-200 hover:text-white transition-colors"
          >
            &larr; Về trang chính
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
