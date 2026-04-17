"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/tap", label: "Các tập" },
  { href: "/tu-dien", label: "Từ điển" },
  { href: "/hoi-dap", label: "Hỏi đáp" },
  { href: "/admin", label: "Quản trị" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sacred-200/50 bg-sacred-50/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Title */}
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight text-sacred-700 hover:text-sacred-500 transition-colors"
          >
            Kitô giáo Tỉnh thức
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-sacred-500 bg-sacred-100"
                    : "text-sacred-700 hover:text-sacred-500 hover:bg-sacred-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-sacred-700 hover:text-sacred-500 hover:bg-sacred-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Mở menu điều hướng"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile navigation panel */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-sacred-200 pt-2">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-sacred-500 bg-sacred-100"
                      : "text-sacred-700 hover:text-sacred-500 hover:bg-sacred-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
