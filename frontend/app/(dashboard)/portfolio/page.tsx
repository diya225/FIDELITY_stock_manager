"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeIndianRupee, BriefcaseBusiness, TrendingDown, Wallet } from "lucide-react";
import { useState } from "react";
import { api, unwrap } from "@/lib/api";
import type { Portfolio } from "@/lib/types";
import { Button, Card, currency } from "@/components/ui";

export default function PortfolioPage() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const portfolio = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => unwrap<Portfolio>(await api.get("/portfolio"))
  });
  const sell = useMutation({
    mutationFn: async (ticker: string) => api.post("/portfolio/sell", { ticker, quantity: 1 }),
    onSuccess: () => {
      setError("");
      client.invalidateQueries();
    },
    onError: () => setError("Sell failed. You can only sell whole shares that you currently own.")
  });

  const holdings = portfolio.data?.holdings ?? [];
  const marketValue = holdings.reduce((sum, holding) => sum + holding.quantity * Number(holding.stock.currentPrice), 0);

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Paper trading ledger</p>
        <h1 className="mt-1 text-3xl font-bold">Portfolio</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="flex items-center justify-between"><div><div className="text-sm text-slate-500 dark:text-slate-400">Market value</div><div className="mt-2 text-2xl font-bold">{currency(marketValue)}</div></div><BadgeIndianRupee className="text-teal-600 dark:text-teal-300" /></div></Card>
        <Card><div className="flex items-center justify-between"><div><div className="text-sm text-slate-500 dark:text-slate-400">Cash balance</div><div className="mt-2 text-2xl font-bold">{currency(portfolio.data?.virtualBalance ?? 0)}</div></div><Wallet className="text-teal-600 dark:text-teal-300" /></div></Card>
        <Card><div className="flex items-center justify-between"><div><div className="text-sm text-slate-500 dark:text-slate-400">Holdings</div><div className="mt-2 text-2xl font-bold">{holdings.length}</div></div><BriefcaseBusiness className="text-teal-600 dark:text-teal-300" /></div></Card>
      </div>
      {error ? <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      <div className="grid gap-4">
        {holdings.map((holding) => {
          const pnl = (Number(holding.stock.currentPrice) - Number(holding.averageBuyPrice)) * holding.quantity;
          return (
            <Card key={holding.id} className="grid gap-4 md:grid-cols-[1fr_repeat(4,120px)_110px] md:items-center">
              <div>
                <div className="font-bold">{holding.stock.ticker}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{holding.stock.name}</div>
              </div>
              <div className="text-sm"><b>{holding.quantity}</b><br />Shares</div>
              <div className="text-sm"><b>{currency(holding.averageBuyPrice)}</b><br />Avg buy</div>
              <div className="text-sm"><b>{currency(holding.stock.currentPrice)}</b><br />Current</div>
              <div className={`text-sm font-bold ${pnl >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{currency(pnl)}</div>
              <Button disabled={sell.isPending} onClick={() => sell.mutate(holding.stock.ticker)}><TrendingDown size={16} /> Sell 1</Button>
            </Card>
          );
        })}
      </div>
      {!portfolio.isLoading && holdings.length === 0 ? <Card className="text-sm text-slate-600 dark:text-slate-400">Your portfolio is empty. Browse recommendations to start investing.</Card> : null}
    </main>
  );
}
