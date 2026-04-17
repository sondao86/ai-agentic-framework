import type { AuthorLens } from "@/types/episode";

type BadgeVariant = AuthorLens | "default" | "A" | "B" | "draft" | "verified" | "published";

const variantStyles: Record<BadgeVariant, string> = {
  tolle: "bg-amber-500/10 text-amber-900 border-amber-300/50",
  demello: "bg-orange-500/10 text-orange-900 border-orange-300/50",
  rohr: "bg-rose-500/10 text-rose-900 border-rose-300/50",
  default: "bg-sacred-500/10 text-sacred-800 border-sacred-300/50",
  A: "bg-blue-500/10 text-blue-900 border-blue-300/50",
  B: "bg-emerald-500/10 text-emerald-900 border-emerald-300/50",
  draft: "bg-gray-500/10 text-gray-700 border-gray-300/50",
  verified: "bg-yellow-500/10 text-yellow-800 border-yellow-300/50",
  published: "bg-green-500/10 text-green-800 border-green-300/50",
};

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  tolle: "Eckhart Tolle",
  demello: "Anthony de Mello",
  rohr: "Richard Rohr",
  A: "Dòng A",
  B: "Dòng B",
  draft: "Bản nháp",
  verified: "Đã xác minh",
  published: "Đã xuất bản",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  const style = variantStyles[variant] || variantStyles.default;
  const label = children ?? variantLabels[variant] ?? variant;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
