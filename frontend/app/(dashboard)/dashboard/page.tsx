"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, BadgeIndianRupee, Briefcase, Gauge, Wallet } from "lucide-react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, unwrap } from "@/lib/api";
import { Badge, Card, currency } from "@/components/ui";

type Dashboard = {
  totalValue: number;
  predictedPnl: number;
  holdingsCount: number;
  portfolioScore: number;
  virtualBalance: number;
  sectorAllocation: Array<{ sector: string; value: number }>;
  gainers: Array<{ ticker: string; changePct: number }>;
  losers: Array<{ ticker: string; changePct: number }>;
  valueHistory: Array<{ date: string; value: number }>;
  insights: Array<{ id: string; suitabilityScore: number; stock: { ticker: string; name: string } }>;
};

const colors = ["#14b8a6", "#f97316", "#6366f1", "#eab308", "#ef4444", "#64748b", "#22c55e"];

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => unwrap<Dashboard>(await api.get("/dashboard"))
  });
  const data = query.data;
  const scoreTone = !data ? "neutral" : data.portfolioScore > 70 ? "green" : data.portfolioScore >= 40 ? "yellow" : "red";
  const totalWithCash = (data?.totalValue ?? 0) + (data?.virtualBalance ?? 0);
  const statCards = [
    { label: "Portfolio + cash", value: currency(totalWithCash), icon: BadgeIndianRupee },
    { label: "Predicted 30D P&L", value: currency(data?.predictedPnl ?? 0), icon: Activity },
    { label: "Holdings", value: data?.holdingsCount ?? 0, icon: Briefcase },
    { label: "Virtual balance", value: currency(data?.virtualBalance ?? 0), icon: Wallet }
  ];

  return (
    <main className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Virtual investment command center</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal">Your Stock Portfolio</h1>
        </div>
        <Card className="flex items-center gap-3 px-4 py-3">
          <Gauge className="text-teal-600 dark:text-teal-300" size={22} />
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Portfolio score</div>
            <Badge tone={scoreTone}>{data?.portfolioScore ?? 0}/100</Badge>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
                  <div className="mt-2 text-2xl font-bold">{item.value}</div>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-200">
                  <Icon size={20} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="h-96">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Portfolio Value Over Time</div>
            <span className="text-xs text-slate-500 dark:text-slate-400">30 days</span>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={data?.valueHistory ?? []}>
              <defs>
                <linearGradient id="portfolioFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
              <Tooltip formatter={(value) => currency(String(value))} />
              <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} fill="url(#portfolioFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-96">
          <div className="mb-3 font-semibold">Sector Allocation</div>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={data?.sectorAllocation ?? []} dataKey="value" nameKey="sector" innerRadius={55} outerRadius={90}>
                {(data?.sectorAllocation ?? []).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => currency(String(value))} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Top BUY Ideas</h2>
          <div className="mt-3 space-y-3">
            {(data?.insights ?? []).map((item) => (
              <div className="flex justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5" key={item.id}><span>{item.stock.ticker}</span><b>{item.suitabilityScore}</b></div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Gainers</h2>
          <div className="mt-3 space-y-3">
            {(data?.gainers ?? []).map((item) => <div className="flex justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5" key={item.ticker}><span>{item.ticker}</span><b className="text-emerald-700 dark:text-emerald-300">{item.changePct}%</b></div>)}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Losers</h2>
          <div className="mt-3 space-y-3">
            {(data?.losers ?? []).map((item) => <div className="flex justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5" key={item.ticker}><span>{item.ticker}</span><b className="text-rose-700 dark:text-rose-300">{item.changePct}%</b></div>)}
          </div>
        </Card>
      </div>
    </main>
  );
}
