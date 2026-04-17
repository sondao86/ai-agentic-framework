interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = false,
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-sacred-200/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm ${hover
          ? "transition-all duration-300 hover:shadow-lg hover:shadow-sacred-900/5 hover:border-sacred-300/80 hover:-translate-y-1"
          : ""
        } ${className}`}
    >
      {children}
    </div>
  );
}
