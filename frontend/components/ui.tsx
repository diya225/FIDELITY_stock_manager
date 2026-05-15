import { HTMLAttributes } from "react";

export const currency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

export const Card = ({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-lg border border-black/10 bg-white/88 p-5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-900/78 ${className}`}
    {...props}
  />
);

export const Badge = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "yellow" | "red" | "neutral" }) => {
  const tones = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
    yellow: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    red: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
    neutral: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

export const Button = ({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400 ${className}`}
    {...props}
  />
);

export const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-md border border-black/10 bg-white/92 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-white/10 dark:bg-white/8 dark:text-slate-100 dark:placeholder:text-slate-500 ${className}`}
    {...props}
  />
);

export const Select = ({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`w-full rounded-md border border-black/10 bg-white/92 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 ${className}`}
    {...props}
  />
);
