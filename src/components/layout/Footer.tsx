export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-sacred-200 bg-sacred-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-sm text-sacred-700 leading-relaxed text-center">
          Dự án này là cầu nối chiêm niệm, không thay thế thần học hay học
          thuyết giáo hội.
        </p>
        <p className="mt-4 text-xs text-sacred-300 text-center">
          &copy; {currentYear} Kitô giáo Tỉnh thức. Mọi quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
}
