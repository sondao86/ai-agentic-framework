import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-sacred-600 to-sacred-800 text-white shadow-md shadow-sacred-900/10 hover:shadow-lg hover:shadow-sacred-900/20 hover:-translate-y-0.5",
  secondary:
    "bg-white/80 text-sacred-800 hover:bg-white hover:text-sacred-900 border border-sacred-200/80 shadow-sm hover:border-sacred-300 hover:-translate-y-0.5 backdrop-blur-sm",
  ghost:
    "bg-transparent text-sacred-700 hover:bg-sacred-50/80 hover:text-sacred-900",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sacred-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
