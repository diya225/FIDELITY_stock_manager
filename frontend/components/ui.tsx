import { HTMLAttributes } from "react";

export const currency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

export const Card = ({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border border-black/10 bg-white p-4 shadow-soft ${className}`} {...props} />
);

export const Badge = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "yellow" | "red" | "neutral" }) => {
  const tones = {
    green: "bg-emerald-100 text-emerald-800",
    yellow: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    neutral: "bg-stone-100 text-stone-700"
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

export const Button = ({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

export const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 ${className}`}
    {...props}
  />
);

export const Select = ({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 ${className}`}
    {...props}
  />
);
