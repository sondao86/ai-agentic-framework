"use client";

import { useSearchParams, useRouter } from "next/navigation";

const filters = [
  { label: "Tất cả", value: "" },
  { label: "Dòng A", value: "A" },
  { label: "Dòng B", value: "B" },
];

export default function WorkstreamFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = searchParams.get("workstream") ?? "";

  function handleFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("workstream", value);
    } else {
      params.delete("workstream");
    }
    router.push(`/tap?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
      <div className="inline-flex bg-white/60 p-1.5 rounded-xl border border-sacred-200/50 backdrop-blur-sm shadow-sm">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${current === f.value
                ? "bg-sacred-600 text-white shadow-md shadow-sacred-900/10"
                : "text-sacred-700/80 hover:bg-sacred-100/50 hover:text-sacred-900"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
