"use client";

import { type StorefrontTheme, themeToCssVars } from "@/lib/theme";
import { storageUrl } from "@/lib/api/client";
import { Heart, MapPin, Search } from "lucide-react";

interface ThemePreviewProps {
  theme: StorefrontTheme;
  logoPreviewUrl?: string | null;
}

function PreviewLogo({ theme, logoPreviewUrl }: ThemePreviewProps) {
  if (theme.logoStyle === "image" && logoPreviewUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoPreviewUrl} alt="Logo" className="h-7 max-w-[100px] object-contain" />
    );
  }

  return (
    <span className="flex items-baseline font-black uppercase tracking-tight text-[var(--dark-gray)]">
      <span className="text-base">M</span>
      <span className="relative text-base">
        Fresh
        <svg className="absolute -bottom-0.5 left-0 w-full" viewBox="0 0 80 8" fill="none" aria-hidden>
          <path
            d="M2 6C20 2 40 1 78 4"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}

export function ThemePreview({ theme, logoPreviewUrl }: ThemePreviewProps) {
  const url =
    logoPreviewUrl ??
    (theme.logoPath ? storageUrl(theme.logoPath) : null);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border shadow-lg"
      style={themeToCssVars(theme)}
    >
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <PreviewLogo theme={theme} logoPreviewUrl={url} />
          <div className="flex flex-1 items-center rounded-full bg-[var(--light-gray)] px-3 py-1.5">
            <span className="flex-1 text-[10px] text-[var(--muted)]">Search Product</span>
            <Search className="h-3 w-3 text-[var(--muted)]" />
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <MapPin className="h-3 w-3 text-[var(--secondary)]" />
            <span className="text-[10px] font-medium text-[var(--dark-gray)]">UAE</span>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary-muted)]">
            <Heart className="h-3 w-3 text-[var(--secondary)]" />
          </div>
          <span className="rounded-md bg-[var(--secondary)] px-2.5 py-1 text-[10px] font-semibold text-white">
            Log In
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-[10px] font-medium text-[var(--dark-gray)]">
          <span className="text-[var(--primary)]">All Categories</span>
          <span>About Us</span>
          <span>FAQs</span>
        </div>
      </div>

      <div className="bg-[var(--hero-gray)] px-5 py-6">
        <p className="text-sm font-bold leading-snug text-[var(--primary)]">
          Get fresh wholesale delivered within 24 hours
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
          Source premium food from verified suppliers worldwide.
        </p>
        <span className="mt-3 inline-block text-[11px] font-bold text-[var(--primary)]">
          Start Sourcing Fresh →
        </span>
        <div className="mt-4 flex gap-2">
          <div
            className="h-8 flex-1 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}22)` }}
          />
          <div className="h-8 w-16 rounded-lg bg-[var(--primary)] opacity-80" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-[var(--fresh-mint)] px-4 py-2">
        <div className="flex gap-1.5">
          {[theme.primary, theme.secondary, theme.heroBackground, theme.text].map((c) => (
            <div
              key={c}
              className="h-4 w-4 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <span className="text-[9px] text-[var(--muted)]">Live preview</span>
      </div>
    </div>
  );
}
