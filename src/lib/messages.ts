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
  status?: string | null;
  adminNotes?: string | null;
  businessName?: string | null;
  phone?: string | null;
  businessType?: string | null;
  country?: string | null;
  subject?: string | null;
  message?: string | null;
  /** Structured form data (newer leads). Older leads kept JSON in `message`. */
  details?: Record<string, unknown> | null;
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
  { value: "role_request", label: "Role requests" },
] as const;

/** Structured lead data: `details` when present, else legacy JSON `message`. */
export function leadPayload(lead: Pick<LeadRecord, "details" | "message">): Record<string, unknown> {
  if (lead.details && typeof lead.details === "object" && !Array.isArray(lead.details)) {
    return lead.details;
  }
  return safeJson(lead.message);
}

/** True when `message` is readable text (not a legacy JSON blob). */
export function isPlainMessage(message?: string | null): message is string {
  return typeof message === "string" && message.trim() !== "" && !message.trim().startsWith("{");
}

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
    case "role_request":
      return "Role request";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

/** Gmail-style subject line for inbox rows */
export function leadSubjectLine(lead: LeadRecord): string {
  const name = lead.contactName?.trim() || "Unknown";
  const payload = leadPayload(lead);

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
    case "role_request": {
      const wanted = (payload.requestedRole as string) || "new role";
      return `Role request: ${wanted} access for ${name}`;
    }
    default:
      return lead.subject?.trim() || `${leadTypeLabel(lead.type)} by ${name}`;
  }
}

export function leadPreview(lead: LeadRecord): string {
  const payload = leadPayload(lead);
  if (lead.type === "distribution") {
    const note = (payload.note as string) || "";
    const territory = (payload.territory as string) || "";
    return [territory && `Territory: ${territory}`, note].filter(Boolean).join(" · ") || lead.email;
  }
  if (lead.type === "quote") {
    const note = (payload.note as string) || "";
    const qty = payload.quantity != null ? String(payload.quantity) : "";
    return [qty && `Qty ${qty}`, note].filter(Boolean).join(" · ") || lead.email;
  }
  if (typeof lead.message === "string" && lead.message && !lead.message.trim().startsWith("{")) {
    return lead.message.slice(0, 120);
  }
  return [lead.businessName, lead.email, lead.phone].filter(Boolean).join(" · ");
}

