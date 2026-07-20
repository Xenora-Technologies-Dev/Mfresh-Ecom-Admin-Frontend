import { api, qs, type ListParams, type PaginatedResponse } from "./client";

export type OrderKind = "BUYER_ORDER" | "SELLER_LISTING";
export type OrderStatus =
  | "PLACED"
  | "UNDER_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId?: string | null;
  productSlug?: string | null;
  productName: string;
  productImage?: string | null;
  quantity: number;
  moqUnit: string;
  price: number;
  currency: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  kind: OrderKind;
  status: OrderStatus;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  userCompany?: string | null;
  userCountry?: string | null;
  productName?: string | null;
  productDescription?: string | null;
  productOrigin?: string | null;
  productImage?: string | null;
  productMoq?: number | null;
  productMoqUnit?: string | null;
  productPrice?: number | null;
  productCurrency?: string | null;
  remarks?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListParams extends ListParams {
  kind?: OrderKind;
  status?: OrderStatus;
  clerkUserId?: string;
}

export const ordersApi = {
  list: (p: OrderListParams = {}) =>
    api<PaginatedResponse<Order>>(`/orders${qs(p)}`),
  get: (id: string) => api<Order>(`/orders/${id}`),
  review: (id: string, data: { status: "VERIFIED" | "REJECTED"; remarks?: string }) =>
    api<Order>(`/orders/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
