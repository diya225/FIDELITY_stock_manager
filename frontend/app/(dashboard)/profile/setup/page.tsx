"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Input, Select, currency } from "@/components/ui";

const allocation = { CONSERVATIVE: 0.1, MODERATE: 0.2, AGGRESSIVE: 0.3 } as const;
const horizon = { SHORT_TERM: 12, MEDIUM_TERM: 24, LONG_TERM: 60 } as const;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    monthlyIncome: 80000,
    monthlyExpenses: 45000,
    currentSavings: 100000,
    investmentGoal: "MEDIUM_TERM",
    riskAppetite: "MODERATE"
  });

  const investable = useMemo(() => {
    const surplus = Math.max(form.monthlyIncome - form.monthlyExpenses, 0);
    return surplus * allocation[form.riskAppetite as keyof typeof allocation] * horizon[form.investmentGoal as keyof typeof horizon];
  }, [form]);

  const mutation = useMutation({
    mutationFn: async () => api.put("/profile/me", form),
    onSuccess: () => router.push("/recommendations")
  });

  const update = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < 4) setStep((current) => current + 1);
    else mutation.mutate();
  };

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Financial Profile</h1>
      <p className="mt-1 text-sm text-stone-600">Step {step + 1} of 5</p>
      <form onSubmit={submit} className="mt-6">
        <Card>
          {step === 0 ? (
            <div className="space-y-4">
              <Input type="number" value={form.monthlyIncome} onChange={(e) => update("monthlyIncome", Number(e.target.value))} />
              <Input type="number" value={form.monthlyExpenses} onChange={(e) => update("monthlyExpenses", Number(e.target.value))} />
              {form.monthlyExpenses >= form.monthlyIncome ? <p className="text-sm text-rose-600">No investable amount available.</p> : null}
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-4">
              <Input type="number" value={form.currentSavings} onChange={(e) => update("currentSavings", Number(e.target.value))} />
              <p className="text-sm text-stone-600">Monthly surplus: {currency(form.monthlyIncome - form.monthlyExpenses)}</p>
            </div>
          ) : null}
          {step === 2 ? (
            <Select value={form.investmentGoal} onChange={(e) => update("investmentGoal", e.target.value)}>
              <option value="SHORT_TERM">Short term, under 1 year</option>
              <option value="MEDIUM_TERM">Medium term, 1 to 3 years</option>
              <option value="LONG_TERM">Long term, over 3 years</option>
            </Select>
          ) : null}
          {step === 3 ? (
            <Select value={form.riskAppetite} onChange={(e) => update("riskAppetite", e.target.value)}>
              <option value="CONSERVATIVE">Conservative</option>
              <option value="MODERATE">Moderate</option>
              <option value="AGGRESSIVE">Aggressive</option>
            </Select>
          ) : null}
          {step === 4 ? (
            <div className="space-y-3">
              <div className="text-3xl font-bold">{currency(investable)}</div>
              <p className="text-sm text-stone-600">This becomes your virtual starting balance.</p>
              {investable < 500 ? <p className="text-sm text-rose-600">Minimum investable amount is INR 500.</p> : null}
            </div>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button type="button" className="bg-stone-600" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
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
