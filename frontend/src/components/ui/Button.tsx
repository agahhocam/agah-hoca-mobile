import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: "bg-primary hover:bg-primary-dark text-white",
  danger: "bg-danger hover:bg-red-700 text-white",
  ghost: "bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-700",
};

export function Button({ variant = "primary", loading, children, className = "", ...props }: Props) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {loading ? "Yükleniyor…" : children}
    </button>
  );
}
