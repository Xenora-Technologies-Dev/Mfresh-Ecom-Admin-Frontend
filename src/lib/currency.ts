export type SupportedCurrency = "USD" | "AED" | "SGD";

export const BASE_CURRENCY: SupportedCurrency = "USD";

export const CURRENCY_OPTIONS: {
  code: SupportedCurrency;
  label: string;
  locale: string;
}[] = [
  { code: "USD", label: "US Dollar", locale: "en-US" },
  { code: "AED", label: "UAE Dirham", locale: "en-AE" },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG" },
];

export const DEFAULT_EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  AED: 3.6725,
  SGD: 1.345,
};

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = BASE_CURRENCY,
): string {
  const option = CURRENCY_OPTIONS.find((c) => c.code === currency);
  return new Intl.NumberFormat(option?.locale ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUsdWithConversion(
  priceUsd: number,
  showAed = true,
  showSgd = true,
  rates = DEFAULT_EXCHANGE_RATES,
): string {
  const parts = [formatCurrency(priceUsd, "USD")];
  if (showAed) {
    parts.push(formatCurrency(priceUsd * rates.AED, "AED"));
  }
  if (showSgd) {
    parts.push(formatCurrency(priceUsd * rates.SGD, "SGD"));
  }
  return parts.join(" · ");
}
