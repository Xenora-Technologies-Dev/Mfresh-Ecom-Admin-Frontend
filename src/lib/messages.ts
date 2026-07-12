/** Session keys for Messages menu badge (clears on login / new session) */
export const MESSAGES_SEEN_AT_KEY = "mfresh-messages-seen-at";

export function getMessagesSeenAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(MESSAGES_SEEN_AT_KEY);
  } catch {
    return null;
  }
}

export function markMessagesSectionSeen() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MESSAGES_SEEN_AT_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function clearMessagesSectionSeen() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(MESSAGES_SEEN_AT_KEY);
  } catch {
    /* ignore */
  }
}

export type LeadRecord = {
  id: string;
  type: string;
  contactName: string;
  email: string;
  businessName?: string | null;
  phone?: string | null;
  businessType?: string | null;
  country?: string | null;
  subject?: string | null;
  message?: string | null;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
};

export const MESSAGE_TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "contact", label: "Contact" },
  { value: "distribution", label: "Distribution" },
  { value: "quote", label: "Quick Quotes" },
  { value: "wishlist", label: "Wishlist" },
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "newsletter", label: "Newsletter" },
] as const;

function safeJson(message?: string | null): Record<string, unknown> {
  if (!message) return {};
  try {
    return JSON.parse(message) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function leadTypeLabel(type: string): string {
  switch (type) {
    case "contact":
      return "Contact";
    case "distribution":
      return "Distribution";
    case "quote":
      return "Quick Quote";
    case "wishlist":
      return "Wishlist";
    case "buyer":
      return "Buyer";
    case "seller":
      return "Seller";
    case "newsletter":
      return "Newsletter";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

/** Gmail-style subject line for inbox rows */
export function leadSubjectLine(lead: LeadRecord): string {
  const name = lead.contactName?.trim() || "Unknown";
  const payload = safeJson(lead.message);

  switch (lead.type) {
    case "distribution": {
      const brand =
        (payload.interestLabel as string) ||
        (payload.interest as string) ||
        lead.businessType ||
        "Distribution";
      return `Distribution form Submission: ${brand} by ${name}`;
    }
    case "quote": {
      const product = payload.product as { name?: string } | undefined;
      const productName = product?.name || lead.subject?.replace(/^Quick Quote:\s*/i, "") || "Product";
      return `Quick Quote Submission: ${productName} by ${name}`;
    }
    case "wishlist": {
      const products = payload.products as unknown[] | undefined;
      const ids = payload.productIds as unknown[] | undefined;
      const count = products?.length ?? ids?.length ?? 0;
      return `Wishlist Share by ${name}${count ? ` (${count} items)` : ""}`;
    }
    case "contact":
      return lead.subject?.trim()
        ? `Contact form Submission: ${lead.subject.trim()} by ${name}`
        : `Contact form Submission by ${name}`;
    case "buyer":
      return `Buyer Registration by ${name}`;
    case "seller":
      return `Seller Registration by ${name}`;
    case "newsletter":
      return `Newsletter Signup: ${lead.email}`;
    default:
      return lead.subject?.trim() || `${leadTypeLabel(lead.type)} by ${name}`;
  }
}

export function leadPreview(lead: LeadRecord): string {
  const payload = safeJson(lead.message);
  if (lead.type === "distribution") {
    const note = (payload.note as string) || "";
    const territory = (payload.territory as string) || "";
    return [territory && `Territory: ${territory}`, note].filter(Boolean).join(" · ") || lead.email;
  }
  if (lead.type === "quote") {
    const note = (payload.note as string) || "";
    const qty = (payload.quantity as string) || "";
    return [qty && `Qty ${qty}`, note].filter(Boolean).join(" · ") || lead.email;
  }
  if (typeof lead.message === "string" && lead.message && !lead.message.trim().startsWith("{")) {
    return lead.message.slice(0, 120);
  }
  return [lead.businessName, lead.email, lead.phone].filter(Boolean).join(" · ");
}

export function parseLeadPayload(message?: string | null) {
  return safeJson(message);
}
