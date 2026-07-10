import {
  getCircleFlagUrlFromCode,
  getProductCountryOptions,
  isoCodeToEmoji,
  resolveCountryCode,
  type WorldCountry,
} from "@/lib/world-countries";

export type CountryOption = {
  name: string;
  code: string;
  flag: string;
};

export function getCountryMeta(name: string): { code: string; flag: string } {
  const code = resolveCountryCode(name) ?? name.slice(0, 2).toUpperCase();
  return { code, flag: isoCodeToEmoji(code) };
}

export function getCircleFlagUrl(nameOrCode: string): string | null {
  const code = resolveCountryCode(nameOrCode);
  if (!code) return null;
  return getCircleFlagUrlFromCode(code);
}

export function getSelectableCountries(): CountryOption[] {
  return getProductCountryOptions().map((c: WorldCountry) => ({
    name: c.name,
    code: c.code,
    flag: isoCodeToEmoji(c.code),
  }));
}
