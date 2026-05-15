"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", stored ? stored === "dark" : prefersDark);
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
