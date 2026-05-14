"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Briefcase, Lightbulb, LogOut, Settings } from "lucide-react";
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

  const logout = async () => {
    await api.post("/auth/logout").catch(() => undefined);
    clearSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-black/10 bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="font-bold">Stock Manager</div>
        <div className="mt-1 text-xs text-stone-500">{user?.email ?? "Demo workspace"}</div>
        <nav className="mt-6 flex gap-2 overflow-x-auto md:flex-col">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-moss text-white" : "text-stone-700 hover:bg-stone-100"
                }`}
                href={item.href}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button className="mt-6 inline-flex items-center gap-2 text-sm text-stone-600" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>
      <section className="flex-1 p-4 md:p-6">{children}</section>
    </div>
  );
}
