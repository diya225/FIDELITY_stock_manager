"use client";

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { data } = await api.post("/auth/refresh");
      useAuthStore.getState().setSession(data.data.user, data.data.accessToken);
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export const unwrap = <T>(response: { data: { data: T } }) => response.data.data;
