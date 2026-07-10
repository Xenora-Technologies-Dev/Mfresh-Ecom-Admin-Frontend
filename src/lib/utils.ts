import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatCurrency, BASE_CURRENCY } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatPriceUsd(amount: number): string {
  return formatCurrency(amount, BASE_CURRENCY);
}

export function formatApiError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join(". ");
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please check your entries and try again.";
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
