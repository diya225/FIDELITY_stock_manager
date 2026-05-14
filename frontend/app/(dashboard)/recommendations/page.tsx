"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { api, unwrap } from "@/lib/api";
import type { Recommendation } from "@/lib/types";
import { Badge, Button, Card, Input, Select, currency } from "@/components/ui";

const toneFor = (signal: string) => (signal === "BUY" ? "green" : signal === "HOLD" ? "yellow" : "red");

export default function RecommendationsPage() {
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [signal, setSignal] = useState("");
  const recs = useQuery({
    queryKey: ["recommendations", q, signal],
    queryFn: async () => unwrap<Recommendation[]>(await api.get("/recommendations", { params: { q, signal: signal || undefined } }))
  });
  const refresh = useMutation({
    mutationFn: async () => api.post("/recommendations/refresh"),
    onSuccess: () => client.invalidateQueries({ queryKey: ["recommendations"] })
  });
  const buy = useMutation({
    mutationFn: async ({ ticker, quantity }: { ticker: string; quantity: number }) => api.post("/portfolio/buy", { ticker, quantity }),
    onSuccess: () => client.invalidateQueries()
  });

  return (
    <main>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Recommendations</h1>
          <p className="text-sm text-stone-600">Top scored NSE ideas for your risk profile.</p>
        </div>
        <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}><RefreshCw size={16} /> Refresh</Button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
          <Input className="pl-9" placeholder="Search ticker or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={signal} onChange={(e) => setSignal(e.target.value)}>
          <option value="">All signals</option>
          <option value="BUY">BUY</option>
          <option value="HOLD">HOLD</option>
          <option value="SELL">SELL</option>
        </Select>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {(recs.data ?? []).map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold">{item.stock.ticker}</div>
                <div className="text-sm text-stone-600">{item.stock.name}</div>
              </div>
              <Badge tone={toneFor(item.signal)}>{item.signal}</Badge>
            </div>
            <p className="mt-3 text-sm text-stone-700">{item.explanation}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><b>{item.suitabilityScore}</b><br />Score</div>
              <div><b>{currency(item.suggestedAmount)}</b><br />Suggested</div>
              <div><b>{currency(item.stock.currentPrice)}</b><br />Price</div>
            </div>
            <Button className="mt-4" disabled={item.signal !== "BUY" || buy.isPending} onClick={() => buy.mutate({ ticker: item.stock.ticker, quantity: 1 })}>
              <ShoppingCart size={16} /> Buy 1
            </Button>
          </Card>
        ))}
      </div>
      {!recs.isLoading && (recs.data ?? []).length === 0 ? <Card className="mt-5 text-sm text-stone-600">No recommendations available. Complete your financial profile or refresh recommendations.</Card> : null}
    </main>
  );
}
