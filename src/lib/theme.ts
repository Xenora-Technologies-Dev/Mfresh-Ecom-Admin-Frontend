export const THEME_SETTING_KEY = "storefront_theme";

export type LogoStyle = "text" | "image";
export type ThemePresetId = "mfresh-default" | "fresh-mint" | "ocean-blue" | "warm-harvest";

export const DEFAULT_LOGO_PATH = "/images/mfresh-logo.png";

export interface StorefrontTheme {
  preset: ThemePresetId;
  logoStyle: LogoStyle;
  logoPath: string | null;
  siteTagline: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  heroBackground: string;
  freshMint: string;
  borderRadius: "soft" | "rounded" | "sharp";
}

/** Seller green (#00A651) + logo navy (#2B3481) */
export const DEFAULT_THEME: StorefrontTheme = {
  preset: "mfresh-default",
  logoStyle: "image",
  logoPath: DEFAULT_LOGO_PATH,
  siteTagline: "Global B2B Food Marketplace",
  primary: "#00A651",
  secondary: "#2B3481",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#2B3481",
  heroBackground: "#E8F7EE",
  freshMint: "#F3FAF5",
  borderRadius: "soft",
};

export const THEME_PRESETS: Record<
  ThemePresetId,
  { name: string; description: string; theme: Partial<StorefrontTheme> }
> = {
  "mfresh-default": {
    name: "MFresh Brand",
    description: "Seller green with logo navy — the MFresh look",
    theme: { ...DEFAULT_THEME },
  },
  "fresh-mint": {
    name: "Fresh Mint",
    description: "Airy mint palette for a clean, organic feel",
    theme: {
      preset: "fresh-mint",
      primary: "#16A34A",
      secondary: "#2B3481",
      background: "#F8FCF9",
      heroBackground: "#EAF8EF",
      freshMint: "#F0FAF4",
      text: "#2B3481",
    },
  },
  "ocean-blue": {
    name: "Ocean Blue",
    description: "Logo navy lead with seller-green accents",
    theme: {
      preset: "ocean-blue",
      primary: "#2B3481",
      secondary: "#00A651",
      background: "#F7F9FC",
      heroBackground: "#EEF2F8",
      freshMint: "#F4F6FB",
      text: "#2B3481",
    },
  },
  "warm-harvest": {
    name: "Warm Harvest",
    description: "Earthy tones for produce & pantry categories",
    theme: {
      preset: "warm-harvest",
      primary: "#7CB342",
      secondary: "#C62828",
      background: "#FFFBF5",
      heroBackground: "#FFF3E0",
      freshMint: "#FFF8F0",
      text: "#3E2723",
    },
  },
};

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

export function lighten(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

export function darken(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

export function mixWithWhite(hex: string, amount: number) {
  return lighten(hex, amount);
}

export function parseTheme(raw: unknown): StorefrontTheme {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_THEME };
  const data = raw as Partial<StorefrontTheme>;
  return {
    ...DEFAULT_THEME,
    ...data,
    preset: (data.preset as ThemePresetId) ?? DEFAULT_THEME.preset,
    logoStyle: data.logoStyle === "text" ? "text" : "image",
    logoPath:
      typeof data.logoPath === "string" && data.logoPath
        ? data.logoPath
        : DEFAULT_LOGO_PATH,
  };
}

export function themeToCssVars(theme: StorefrontTheme): Record<string, string> {
  const primaryDark = darken(theme.primary, 0.18);
  const primaryLight = lighten(theme.primary, 0.15);
  const primaryMuted = mixWithWhite(theme.primary, 0.88);
  const secondaryDark = darken(theme.secondary, 0.12);
  const secondaryMuted = mixWithWhite(theme.secondary, 0.9);
  const lightGray = mixWithWhite(theme.text, 0.94);
  const border = mixWithWhite(theme.text, 0.85);
  const muted = mixWithWhite(theme.text, 0.45);

  return {
    "--background": theme.background,
    "--foreground": theme.text,
    "--primary": theme.primary,
    "--primary-dark": primaryDark,
    "--primary-light": primaryLight,
    "--primary-muted": primaryMuted,
    "--secondary": theme.secondary,
    "--secondary-dark": secondaryDark,
    "--secondary-muted": secondaryMuted,
    "--fresh-mint": theme.freshMint,
    "--light-gray": lightGray,
    "--hero-gray": theme.heroBackground,
    "--dark-gray": theme.text,
    "--muted": muted,
    "--border": border,
    "--surface": theme.surface,
  } as Record<string, string>;
}

export function applyPreset(presetId: ThemePresetId): StorefrontTheme {
  const preset = THEME_PRESETS[presetId];
  return parseTheme({ ...DEFAULT_THEME, ...preset.theme, preset: presetId });
}
