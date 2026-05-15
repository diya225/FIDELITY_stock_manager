"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Briefcase, Lightbulb, LogOut, Moon, Settings, ShieldCheck, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/profile/setup", label: "Profile", icon: Settings }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => undefined);
    clearSession();
    router.push("/login");
  };

  const visibleLinks = user?.role === "ADMIN" ? [...links, { href: "/admin", label: "Admin", icon: ShieldCheck }] : links;

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 md:flex">
      <aside className="border-b border-black/10 bg-white/82 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-black text-white dark:bg-teal-400 dark:text-slate-950">
            SM
          </div>
          <div>
            <div className="font-bold">Stock Manager</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email ?? "Demo workspace"}</div>
          </div>
        </div>
        <nav className="mt-8 flex gap-2 overflow-x-auto md:flex-col">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm dark:bg-teal-400 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/8"
                }`}
                href={item.href}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 rounded-lg border border-black/10 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {darkMode ? <Moon size={16} /> : <Sun size={16} />}
              {darkMode ? "Dark mode" : "Light mode"}
            </div>
            <button
              aria-label="Toggle dark mode"
              className={`relative h-7 w-12 rounded-full p-1 transition ${darkMode ? "bg-teal-400" : "bg-slate-300"}`}
              onClick={toggleTheme}
              type="button"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition dark:bg-slate-950 ${
                  darkMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
        <button className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>
      <section className="flex-1 p-4 md:p-7">{children}</section>
    </div>
  );
}
