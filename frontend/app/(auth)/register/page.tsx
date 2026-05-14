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
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input name="fullName" placeholder="Full name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required />
          <Input name="confirmPassword" type="password" placeholder="Confirm password" required />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full" type="submit">Create account</Button>
        </form>
        <p className="mt-4 text-sm text-stone-600">
          Already registered? <Link className="font-semibold text-moss" href="/login">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}
