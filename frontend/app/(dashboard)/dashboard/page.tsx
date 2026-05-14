"use client";

import { useQuery } from "@tanstack/react-query";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const colors = ["#3f6b4f", "#d97059", "#d79b2b", "#5c6f82", "#8c6f4a", "#6e5c7f"];

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => unwrap<Dashboard>(await api.get("/dashboard"))
  });
  const data = query.data;
  const scoreTone = !data ? "neutral" : data.portfolioScore > 70 ? "green" : data.portfolioScore >= 40 ? "yellow" : "red";

  return (
    <main>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-stone-600">Total portfolio value</div><div className="text-2xl font-bold">{currency(data?.totalValue ?? 0)}</div></Card>
        <Card><div className="text-sm text-stone-600">Predicted 30D P&L</div><div className="text-2xl font-bold">{currency(data?.predictedPnl ?? 0)}</div></Card>
        <Card><div className="text-sm text-stone-600">Holdings</div><div className="text-2xl font-bold">{data?.holdingsCount ?? 0}</div></Card>
        <Card><div className="text-sm text-stone-600">Portfolio score</div><div className="mt-2"><Badge tone={scoreTone}>{data?.portfolioScore ?? 0}/100</Badge></div></Card>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="h-80">
          <div className="mb-3 font-semibold">Portfolio Value Over Time</div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={data?.valueHistory ?? []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => currency(String(value))} />
              <Line type="monotone" dataKey="value" stroke="#3f6b4f" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-80">
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
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Top BUY Ideas</h2>
          <div className="mt-3 space-y-3">
            {(data?.insights ?? []).map((item) => (
              <div className="flex justify-between text-sm" key={item.id}><span>{item.stock.ticker}</span><b>{item.suitabilityScore}</b></div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Gainers</h2>
          <div className="mt-3 space-y-3">
            {(data?.gainers ?? []).map((item) => <div className="flex justify-between text-sm" key={item.ticker}><span>{item.ticker}</span><b className="text-emerald-700">{item.changePct}%</b></div>)}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Losers</h2>
          <div className="mt-3 space-y-3">
            {(data?.losers ?? []).map((item) => <div className="flex justify-between text-sm" key={item.ticker}><span>{item.ticker}</span><b className="text-rose-700">{item.changePct}%</b></div>)}
          </div>
        </Card>
      </div>
    </main>
  );
}
