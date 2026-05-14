"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingDown } from "lucide-react";
import { api, unwrap } from "@/lib/api";
import type { Portfolio } from "@/lib/types";
import { Button, Card, currency } from "@/components/ui";

export default function PortfolioPage() {
  const client = useQueryClient();
  const portfolio = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => unwrap<Portfolio>(await api.get("/portfolio"))
  });
  const sell = useMutation({
    mutationFn: async (ticker: string) => api.post("/portfolio/sell", { ticker, quantity: 1 }),
    onSuccess: () => client.invalidateQueries()
  });

  const holdings = portfolio.data?.holdings ?? [];
  const marketValue = holdings.reduce((sum, holding) => sum + holding.quantity * Number(holding.stock.currentPrice), 0);

  return (
    <main>
      <h1 className="text-2xl font-bold">Portfolio</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Card><div className="text-sm text-stone-600">Market value</div><div className="text-2xl font-bold">{currency(marketValue)}</div></Card>
        <Card><div className="text-sm text-stone-600">Cash balance</div><div className="text-2xl font-bold">{currency(portfolio.data?.virtualBalance ?? 0)}</div></Card>
        <Card><div className="text-sm text-stone-600">Holdings</div><div className="text-2xl font-bold">{holdings.length}</div></Card>
      </div>
      <div className="mt-5 grid gap-4">
        {holdings.map((holding) => {
          const pnl = (Number(holding.stock.currentPrice) - Number(holding.averageBuyPrice)) * holding.quantity;
          return (
            <Card key={holding.id} className="grid gap-4 md:grid-cols-[1fr_repeat(4,120px)] md:items-center">
              <div>
                <div className="font-bold">{holding.stock.ticker}</div>
                <div className="text-sm text-stone-600">{holding.stock.name}</div>
              </div>
              <div className="text-sm"><b>{holding.quantity}</b><br />Shares</div>
              <div className="text-sm"><b>{currency(holding.averageBuyPrice)}</b><br />Avg buy</div>
              <div className="text-sm"><b>{currency(holding.stock.currentPrice)}</b><br />Current</div>
              <div className={`text-sm font-bold ${pnl >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{currency(pnl)}</div>
              <Button disabled={sell.isPending} onClick={() => sell.mutate(holding.stock.ticker)}><TrendingDown size={16} /> Sell 1</Button>
            </Card>
          );
        })}
      </div>
      {!portfolio.isLoading && holdings.length === 0 ? <Card className="mt-5 text-sm text-stone-600">Your portfolio is empty. Browse recommendations to start investing.</Card> : null}
    </main>
  );
}
