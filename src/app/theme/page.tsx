"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ExternalLink,
  Palette,
  RotateCcw,
  Sparkles,
  Type,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ThemePreview } from "@/components/admin/theme-preview";
import { LogoUploader } from "@/components/admin/logo-uploader";
import { useUploadGuard } from "@/hooks/use-upload-guard";
import { settingsApi } from "@/lib/api";
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  THEME_SETTING_KEY,
  applyPreset,
  parseTheme,
  type StorefrontTheme,
  type ThemePresetId,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const COLOR_FIELDS = [
  { key: "primary" as const, label: "Brand Color", hint: "Headings, links & main buttons" },
  { key: "secondary" as const, label: "Accent Color", hint: "Login button, icons & highlights" },
  { key: "background" as const, label: "Page Background", hint: "Main site background" },
  { key: "heroBackground" as const, label: "Hero Section", hint: "Homepage banner area" },
  { key: "freshMint" as const, label: "Soft Tint", hint: "Section backgrounds & cards" },
  { key: "text" as const, label: "Text Color", hint: "Body text & navigation" },
];

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
      <label className="relative cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <span
          className="block h-11 w-11 rounded-xl border-2 border-white shadow-md ring-1 ring-border"
          style={{ backgroundColor: value }}
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 font-mono text-xs uppercase"
        maxLength={7}
      />
    </div>
  );
}

export default function ThemePage() {
  const qc = useQueryClient();
  const [theme, setTheme] = useState<StorefrontTheme>(DEFAULT_THEME);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  useUploadGuard(imageUploading);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.list(),
  });

  useEffect(() => {
    if (!settings) return;
    const row = settings.find((s) => (s as { key: string }).key === THEME_SETTING_KEY);
    if (row) {
      setTheme(parseTheme((row as { value: unknown }).value));
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () =>
      settingsApi.bulk([{ key: THEME_SETTING_KEY, value: theme }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const applyThemePreset = (presetId: ThemePresetId) => {
    setTheme(applyPreset(presetId));
  };

  const resetToDefault = () => {
    setTheme({ ...DEFAULT_THEME });
    setLogoPreviewUrl(null);
  };

  const update = <K extends keyof StorefrontTheme>(key: K, value: StorefrontTheme[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Theme & Branding</h2>
              <p className="text-sm text-muted">
                Customize your storefront look — changes apply instantly after saving
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4" />
            Reset Default
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={storefrontUrl} target="_blank">
              <ExternalLink className="h-4 w-4" />
              View Storefront
            </Link>
          </Button>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || isLoading || imageUploading}>
            {imageUploading ? "Uploading…" : save.isPending ? "Saving..." : saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Theme"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Quick Start Themes</h3>
            </div>
            <p className="mb-4 text-sm text-muted">
              Pick a ready-made palette — you can fine-tune colors below anytime.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.entries(THEME_PRESETS) as [ThemePresetId, (typeof THEME_PRESETS)[ThemePresetId]][]).map(
                ([id, preset]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => applyThemePreset(id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                      theme.preset === id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-white hover:border-primary/30",
                    )}
                  >
                    <div className="mb-3 flex gap-1.5">
                      {[preset.theme.primary, preset.theme.secondary, preset.theme.heroBackground]
                        .filter(Boolean)
                        .map((c) => (
                          <span
                            key={String(c)}
                            className="h-6 w-6 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: c as string }}
                          />
                        ))}
                    </div>
                    <p className="text-sm font-semibold">{preset.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{preset.description}</p>
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Logo</h3>
            </div>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => update("logoStyle", "text")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  theme.logoStyle === "text"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-background",
                )}
              >
                <Type className="h-4 w-4" />
                MFresh Text Logo
              </button>
              <button
                type="button"
                onClick={() => update("logoStyle", "image")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  theme.logoStyle === "image"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-background",
                )}
              >
                <ImageIcon className="h-4 w-4" />
                Custom Image
              </button>
            </div>
            {theme.logoStyle === "image" && (
              <LogoUploader
                value={theme.logoPath}
                onChange={(path, preview) => {
                  update("logoPath", path);
                  setLogoPreviewUrl(preview);
                }}
                onUploadingChange={setImageUploading}
              />
            )}
            {theme.logoStyle === "text" && (
              <p className="rounded-lg bg-background px-3 py-2 text-xs text-muted">
                Uses the classic <strong>M Fresh</strong> wordmark with a green accent swoosh.
              </p>
            )}
            <div className="mt-4 space-y-1.5">
              <Label>Site Tagline</Label>
              <Input
                value={theme.siteTagline}
                onChange={(e) => update("siteTagline", e.target.value)}
                placeholder="Global B2B Food Marketplace"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-semibold">Brand Colors</h3>
            <p className="mb-4 text-sm text-muted">
              Tap a color swatch or enter a hex code. Preview updates in real time.
            </p>
            <div className="space-y-3">
              {COLOR_FIELDS.map((field) => (
                <ColorField
                  key={field.key}
                  label={field.label}
                  hint={field.hint}
                  value={theme[field.key]}
                  onChange={(v) => update(field.key, v)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold">Corner Style</h3>
            <div className="flex gap-2">
              {(
                [
                  { id: "soft", label: "Soft" },
                  { id: "rounded", label: "Rounded" },
                  { id: "sharp", label: "Sharp" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update("borderRadius", opt.id)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    theme.borderRadius === opt.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-background",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Live Preview
            </p>
            <ThemePreview theme={theme} logoPreviewUrl={logoPreviewUrl} />
            <p className="mt-3 text-center text-[11px] text-muted">
              This is how your header & hero will look
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
