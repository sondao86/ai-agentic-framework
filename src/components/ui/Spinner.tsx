interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-sacred-200 border-t-sacred-500 ${sizeStyles[size]} ${className}`}
      role="status"
      aria-label="Dang tai..."
    >
      <span className="sr-only">Dang tai...</span>
    </div>
  );
}
