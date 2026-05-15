"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, unwrap } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button, Card, Input } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = unwrap<{ user: User; accessToken: string }>(
        await api.post("/auth/register", {
          fullName: form.get("fullName"),
          email: form.get("email"),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword")
        })
      );
      setSession(data.user, data.accessToken);
      router.push("/profile/setup");
    } catch {
      setError("Please check the fields and try again.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 text-slate-950 dark:text-slate-100">
      <Card className="w-full max-w-md">
        <div className="mb-6 grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-black text-white dark:bg-teal-400 dark:text-slate-950">SM</div>
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Start with a safe virtual balance and guided recommendations.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input name="fullName" placeholder="Full name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required />
          <Input name="confirmPassword" type="password" placeholder="Confirm password" required />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full" type="submit">Create account</Button>
        </form>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Already registered? <Link className="font-semibold text-teal-700 dark:text-teal-300" href="/login">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}
