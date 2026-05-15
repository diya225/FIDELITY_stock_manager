"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { RefreshCw, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { api, unwrap } from "@/lib/api";
import type { Recommendation } from "@/lib/types";
import { Badge, Button, Card, Input, Select, currency } from "@/components/ui";

const toneFor = (signal: string) => (signal === "BUY" ? "green" : signal === "HOLD" ? "yellow" : "red");
const errorMessage = (error: unknown) =>
  axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
    ? error.response.data.error
    : "Something went wrong. Please try again.";

export default function RecommendationsPage() {
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [signal, setSignal] = useState("BUY");
  const [sector, setSector] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [error, setError] = useState("");
  const recs = useQuery({
    queryKey: ["recommendations", q, signal, sector, riskLevel],
    queryFn: async () =>
      unwrap<Recommendation[]>(
        await api.get("/recommendations", {
          params: {
            q,
            signal: signal || undefined,
            sector: sector || undefined,
            riskLevel: riskLevel || undefined
          }
        })
      )
  });
  const refresh = useMutation({
    mutationFn: async () => api.post("/recommendations/refresh"),
    onSuccess: () => {
      setError("");
      client.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (error) => setError(errorMessage(error))
  });
  const buy = useMutation({
    mutationFn: async ({ ticker, quantity }: { ticker: string; quantity: number }) => api.post("/portfolio/buy", { ticker, quantity }),
    onSuccess: () => {
      setError("");
      client.invalidateQueries();
    },
    onError: (error) => setError(errorMessage(error))
  });

  return (
    <main className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">AI-assisted ideas</p>
          <h1 className="mt-1 text-3xl font-bold">Recommendations</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Search, filter, and buy suitable NSE stocks with virtual money.</p>
        </div>
        <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}><RefreshCw size={16} /> Refresh</Button>
      </div>
      <Card className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <Input className="pl-9" placeholder="Search ticker or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
          <Select className="pl-9" value={signal} onChange={(e) => setSignal(e.target.value)}>
            <option value="">All signals</option>
            <option value="BUY">BUY</option>
            <option value="HOLD">HOLD</option>
            <option value="SELL">SELL</option>
          </Select>
        </div>
        <Select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All sectors</option>
          <option value="IT">IT</option>
          <option value="Banking">Banking</option>
          <option value="Energy">Energy</option>
          <option value="FMCG">FMCG</option>
          <option value="Pharma">Pharma</option>
          <option value="Automobile">Automobile</option>
          <option value="Metals">Metals</option>
          <option value="Infrastructure">Infrastructure</option>
        </Select>
        <Select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
          <option value="">All risk levels</option>
          <option value="LOW">Low risk</option>
          <option value="MEDIUM">Medium risk</option>
          <option value="HIGH">High risk</option>
        </Select>
      </Card>
      {error ? <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {(recs.data ?? []).map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold">{item.stock.ticker}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{item.stock.name}</div>
              </div>
              <Badge tone={toneFor(item.signal)}>{item.signal}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.explanation}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3 xl:grid-cols-6">
              <div><b>{item.suitabilityScore}</b><br />Score</div>
              <div><b>{Number(item.confidence).toFixed(2)}</b><br />Confidence</div>
              <div><b>{currency(item.suggestedAmount)}</b><br />Suggested</div>
              <div><b>{currency(item.stock.currentPrice)}</b><br />Price</div>
              <div><b>{item.stock.sector}</b><br />Sector</div>
              <div><b>{item.riskLevel ?? "MEDIUM"}</b><br />Risk</div>
            </div>
            <Button className="mt-4" disabled={item.signal !== "BUY" || buy.isPending} onClick={() => buy.mutate({ ticker: item.stock.ticker, quantity: 1 })}>
              <ShoppingCart size={16} /> Buy 1
            </Button>
          </Card>
        ))}
      </div>
      {!recs.isLoading && (recs.data ?? []).length === 0 ? <Card className="text-sm text-slate-600 dark:text-slate-400">No recommendations available. Complete your financial profile or refresh recommendations.</Card> : null}
    </main>
  );
}
