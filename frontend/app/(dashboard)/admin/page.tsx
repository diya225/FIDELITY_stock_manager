"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api, unwrap } from "@/lib/api";
import type { Stock, User } from "@/lib/types";
import { Badge, Button, Card, Input } from "@/components/ui";

type StockDraft = {
  currentPrice: string;
  changePct: string;
  isActive: boolean;
};

export default function AdminPage() {
  const client = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, StockDraft>>({});
  const [message, setMessage] = useState("");

  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => unwrap<User[]>(await api.get("/admin/users"))
  });
  const stocks = useQuery({
    queryKey: ["admin", "stocks"],
    queryFn: async () => unwrap<Stock[]>(await api.get("/admin/stocks"))
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/admin/users/${id}`, { isActive }),
    onSuccess: () => {
      setMessage("User status updated.");
      client.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => setMessage("Only admins can update users.")
  });

  const updateStock = useMutation({
    mutationFn: async ({ ticker, draft }: { ticker: string; draft: StockDraft }) =>
      api.put(`/admin/stocks/${ticker}`, {
        currentPrice: Number(draft.currentPrice),
        changePct: Number(draft.changePct),
        isActive: draft.isActive
      }),
    onSuccess: () => {
      setMessage("Stock updated.");
      client.invalidateQueries({ queryKey: ["admin", "stocks"] });
    },
    onError: () => setMessage("Stock update failed. Check price and change values.")
  });

  const stockDraft = (stock: Stock): StockDraft =>
    drafts[stock.ticker] ?? {
      currentPrice: String(stock.currentPrice),
      changePct: String(stock.changePct),
      isActive: Boolean(stock.isActive)
    };

  const setStockDraft = (ticker: string, patch: Partial<StockDraft>) =>
    setDrafts((current) => ({ ...current, [ticker]: { ...stockDraft(stocks.data?.find((item) => item.ticker === ticker)!), ...patch } }));

  return (
    <main className="space-y-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300"><ShieldCheck size={16} /> Platform operations</p>
        <h1 className="mt-1 text-3xl font-bold">Admin</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Manage demo users, stock prices, and active recommendation eligibility.</p>
      </div>
      {message ? <Card className="text-sm text-slate-700 dark:text-slate-200">{message}</Card> : null}

      <Card>
        <h2 className="font-semibold">Users</h2>
        <div className="mt-4 grid gap-3">
          {(users.data ?? []).map((user) => (
            <div key={user.id} className="grid gap-3 rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5 md:grid-cols-[1fr_120px_120px] md:items-center">
              <div>
                <div className="font-semibold">{user.fullName}</div>
                <div className="text-slate-500 dark:text-slate-400">{user.email}</div>
              </div>
              <Badge tone={user.role === "ADMIN" ? "green" : "neutral"}>{user.role}</Badge>
              <Button
                className={user.isActive ? "bg-slate-500 hover:bg-slate-600 dark:bg-slate-700 dark:text-white" : ""}
                disabled={updateUser.isPending}
                onClick={() => updateUser.mutate({ id: user.id, isActive: !user.isActive })}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Stocks</h2>
        <div className="mt-4 grid gap-3">
          {(stocks.data ?? []).map((stock) => {
            const draft = stockDraft(stock);
            return (
              <div key={stock.id} className="grid gap-3 rounded-md bg-slate-50 p-3 text-sm dark:bg-white/5 lg:grid-cols-[1fr_130px_110px_120px_110px] lg:items-center">
                <div>
                  <div className="font-semibold">{stock.ticker}</div>
                  <div className="text-slate-500 dark:text-slate-400">{stock.name} · {stock.sector}</div>
                </div>
                <Input aria-label={`${stock.ticker} price`} value={draft.currentPrice} onChange={(event) => setStockDraft(stock.ticker, { currentPrice: event.target.value })} />
                <Input aria-label={`${stock.ticker} change percent`} value={draft.changePct} onChange={(event) => setStockDraft(stock.ticker, { changePct: event.target.value })} />
                <button
                  className={`relative h-8 w-14 rounded-full p-1 transition ${draft.isActive ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  onClick={() => setStockDraft(stock.ticker, { isActive: !draft.isActive })}
                  type="button"
                >
                  <span className={`block h-6 w-6 rounded-full bg-white shadow transition ${draft.isActive ? "translate-x-6" : "translate-x-0"}`} />
                </button>
                <Button disabled={updateStock.isPending} onClick={() => updateStock.mutate({ ticker: stock.ticker, draft })}>
                  <Save size={16} /> Save
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
