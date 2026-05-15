"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, unwrap } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { Badge, Button, Card, Input, Select, currency } from "@/components/ui";

const allocation = { CONSERVATIVE: 0.1, MODERATE: 0.2, AGGRESSIVE: 0.3 } as const;
const horizon = { SHORT_TERM: 12, MEDIUM_TERM: 24, LONG_TERM: 60 } as const;

export default function ProfileSetupPage() {
  const router = useRouter();
  const client = useQueryClient();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState("");
  const [simulatedIncome, setSimulatedIncome] = useState(90000);
  const [form, setForm] = useState({
    monthlyIncome: 80000,
    monthlyExpenses: 45000,
    currentSavings: 100000,
    investmentGoal: "MEDIUM_TERM",
    riskAppetite: "MODERATE"
  });

  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => unwrap<Profile | null>(await api.get("/profile/me"))
  });

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      monthlyIncome: Number(profile.data.monthlyIncome),
      monthlyExpenses: Number(profile.data.monthlyExpenses),
      currentSavings: Number(profile.data.currentSavings),
      investmentGoal: profile.data.investmentGoal,
      riskAppetite: profile.data.riskAppetite
    });
    setSimulatedIncome(Number(profile.data.monthlyIncome));
    setSaved(`Saved profile loaded. Current investable amount: ${currency(profile.data.investableAmount)}.`);
  }, [profile.data]);

  const investable = useMemo(() => {
    const surplus = Math.max(form.monthlyIncome - form.monthlyExpenses, 0);
    return surplus * allocation[form.riskAppetite as keyof typeof allocation] * horizon[form.investmentGoal as keyof typeof horizon];
  }, [form]);
  const simulatedInvestable = useMemo(() => {
    const surplus = Math.max(simulatedIncome - form.monthlyExpenses, 0);
    return surplus * allocation[form.riskAppetite as keyof typeof allocation] * horizon[form.investmentGoal as keyof typeof horizon];
  }, [form.investmentGoal, form.monthlyExpenses, form.riskAppetite, simulatedIncome]);

  const mutation = useMutation({
    mutationFn: async () => api.put("/profile/me", form),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["profile", "me"] });
      router.push("/recommendations");
    },
    onError: () => setSaved("Profile could not be saved. Check that expenses are lower than income and investable amount is at least INR 500.")
  });

  const update = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < 4) setStep((current) => current + 1);
    else mutation.mutate();
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Personal investment limits</p>
        <h1 className="mt-1 text-3xl font-bold">Financial Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Step {step + 1} of 5</p>
      </div>
      {saved ? <Card className="text-sm text-slate-700 dark:text-slate-200">{saved}</Card> : null}
      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className={`h-2 rounded-full ${item <= step ? "bg-teal-600 dark:bg-teal-300" : "bg-slate-200 dark:bg-white/10"}`} />
        ))}
      </div>
      <form onSubmit={submit} className="mt-6">
        <Card>
          {step === 0 ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Monthly income<Input className="mt-2" type="number" value={form.monthlyIncome} onChange={(e) => update("monthlyIncome", Number(e.target.value))} /></label>
              <label className="block text-sm font-medium">Monthly expenses<Input className="mt-2" type="number" value={form.monthlyExpenses} onChange={(e) => update("monthlyExpenses", Number(e.target.value))} /></label>
              {form.monthlyExpenses >= form.monthlyIncome ? <p className="text-sm text-rose-600 dark:text-rose-300">No investable amount available.</p> : null}
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Current savings<Input className="mt-2" type="number" value={form.currentSavings} onChange={(e) => update("currentSavings", Number(e.target.value))} /></label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Monthly surplus: {currency(form.monthlyIncome - form.monthlyExpenses)}</p>
            </div>
          ) : null}
          {step === 2 ? (
            <label className="block text-sm font-medium">Investment goal<Select className="mt-2" value={form.investmentGoal} onChange={(e) => update("investmentGoal", e.target.value)}>
                <option value="SHORT_TERM">Short term, under 1 year</option>
                <option value="MEDIUM_TERM">Medium term, 1 to 3 years</option>
                <option value="LONG_TERM">Long term, over 3 years</option>
              </Select></label>
          ) : null}
          {step === 3 ? (
            <label className="block text-sm font-medium">Risk appetite<Select className="mt-2" value={form.riskAppetite} onChange={(e) => update("riskAppetite", e.target.value)}>
                <option value="CONSERVATIVE">Conservative</option>
                <option value="MODERATE">Moderate</option>
                <option value="AGGRESSIVE">Aggressive</option>
              </Select></label>
          ) : null}
          {step === 4 ? (
            <div className="space-y-3">
              <div className="text-3xl font-bold">{currency(investable)}</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">This becomes your virtual starting balance.</p>
              <Badge tone={form.riskAppetite === "AGGRESSIVE" ? "red" : form.riskAppetite === "MODERATE" ? "yellow" : "green"}>{form.riskAppetite}</Badge>
              <div className="mt-5 rounded-lg border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <label className="block text-sm font-medium">
                  Affordability simulator: monthly income
                  <Input className="mt-2" type="number" value={simulatedIncome} onChange={(e) => setSimulatedIncome(Number(e.target.value))} />
                </label>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  If income changes to {currency(simulatedIncome)}, estimated investable capacity becomes{" "}
                  <b className="text-slate-950 dark:text-white">{currency(simulatedInvestable)}</b>.
                </p>
              </div>
              {investable < 500 ? <p className="text-sm text-rose-600 dark:text-rose-300">Minimum investable amount is INR 500.</p> : null}
            </div>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button type="button" className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-700 dark:text-white" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
            <Button disabled={form.monthlyExpenses >= form.monthlyIncome || investable < 500 || mutation.isPending}>
              {step === 4 ? "Save profile" : "Continue"}
            </Button>
          </div>
        </Card>
      </form>
    </main>
  );
}
