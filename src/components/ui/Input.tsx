import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseStyles =
  "w-full rounded-xl border border-sacred-200/60 bg-white/70 backdrop-blur-sm px-4 py-3 text-base text-sacred-900 placeholder:text-sacred-400/70 focus:border-sacred-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sacred-400/10 transition-all duration-200 shadow-sm";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-sacred-700"
        >
          {label}
        </label>
      )}
      <input id={id} className={`${baseStyles} ${className}`} {...props} />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  className?: string;
}

export function Textarea({
  label,
  className = "",
  id,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-sacred-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${baseStyles} min-h-[100px] resize-y ${className}`}
        {...props}
      />
    </div>
  );
}
