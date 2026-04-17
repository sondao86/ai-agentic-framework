"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef } from "react";
import { Input } from "@/components/ui/Input";

const categories = [
  { label: "Tất cả", value: "" },
  { label: "Chiêm niệm", value: "contemplative" },
  { label: "Kinh Thánh", value: "biblical" },
  { label: "Chánh niệm", value: "mindfulness" },
  { label: "Chung", value: "general" },
];

export default function GlossarySearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tu-dien?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-sacred-300 to-sacred-500 rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
        <Input
          id="glossary-search"
          label=""
          placeholder="Tìm kiếm thuật ngữ hoặc ý nghĩa..."
          defaultValue={currentSearch}
          className="bg-white/70 border-sacred-200/50 shadow-inner px-5 py-3 text-base"
          onChange={(e) => {
            const value = e.target.value;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => updateParams("search", value), 400);
          }}
        />
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sacred-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateParams("category", cat.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${currentCategory === cat.value
                ? "bg-sacred-600 text-white shadow-md shadow-sacred-900/15"
                : "bg-white/60 text-sacred-700/80 border border-sacred-200/50 hover:bg-sacred-100 hover:text-sacred-900 shadow-sm"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
