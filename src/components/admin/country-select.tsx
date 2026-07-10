"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
  getCircleFlagUrl,
  getCountryMeta,
  getSelectableCountries,
} from "@/lib/countries";
import { cn } from "@/lib/utils";

function FlagIcon({ country, size = 20 }: { country: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const url = getCircleFlagUrl(country);
  const { flag } = getCountryMeta(country);

  if (!url || failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[0.7em] leading-none ring-1 ring-black/5"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {flag}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className="inline-block shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/10"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Search country…",
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefer showing existing country even if not in the curated list
  const countries = useMemo(() => {
    const base = getSelectableCountries();
    if (value && !base.some((c) => c.name === value)) {
      const meta = getCountryMeta(value);
      return [{ name: value, code: meta.code, flag: meta.flag }, ...base];
    }
    return base;
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        // aliases
        (q === "uae" && c.code === "AE") ||
        (q === "uk" && c.code === "GB") ||
        (q === "usa" && c.code === "US"),
    );
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-left text-sm hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ? (
          <span className="flex min-w-0 items-center gap-2">
            <FlagIcon country={value} size={20} />
            <span className="truncate font-medium">{value}</span>
          </span>
        ) : (
          <span className="text-muted">Select country…</span>
        )}
        <span className="flex shrink-0 items-center gap-1">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded p-0.5 text-muted hover:bg-gray-100 hover:text-dark-gray"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              aria-label="Clear country"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 text-muted" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-muted">
                No countries match “{query}”
              </li>
            ) : (
              filtered.map((c) => {
                const selected = c.name === value;
                return (
                  <li key={c.code + c.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-primary/5",
                        selected && "bg-primary/10 font-medium text-primary",
                      )}
                      onClick={() => {
                        onChange(c.name);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <FlagIcon country={c.name} size={22} />
                      <span className="flex-1 truncate">{c.name}</span>
                      {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
