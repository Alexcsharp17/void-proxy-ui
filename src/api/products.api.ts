/**
 * Public products API (no auth required for GET).
 * GET /products/proxies - proxy products for pricing page.
 * GET /products/:id/pricing-table - pricing table for a product.
 * GET /products/pricing-modifiers?productId= - modifiers (SPEED, EXPIRATION_DAYS) for a product.
 */
import { api } from './client';
import type {
  Product,
  PricingTableResponse,
  PricingModifiersResponse,
} from './types';

export const productsApi = {
  async getProxyProducts(): Promise<Product[]> {
    const res = await api.get<Product[]>('/products/proxies');
    const data = res.data;
    if (!Array.isArray(data)) return [];
    return data.filter((p) => p && (p as Product).isActive !== false);
  },

  async getPricingTable(productId: number | string): Promise<PricingTableResponse> {
    const id = typeof productId === 'string' ? Number(productId) : productId;
    const res = await api.get<PricingTableResponse>(`/products/${id}/pricing-table`);
    return res.data;
  },

  async getPricingModifiers(productId?: number | string): Promise<PricingModifiersResponse> {
    const params = productId != null ? { productId: Number(productId) } : {};
    const res = await api.get<PricingModifiersResponse>('/products/pricing-modifiers', { params });
    return res.data;
  },

  /** AddOns products (serviceType 20) for Add-ons page. */
  async getAddonProducts(): Promise<Product[]> {
    const res = await api.get<Product[]>('/products/by-service-type/20');
    const data = res.data;
    if (!Array.isArray(data)) return [];
    return data.filter((p) => p && (p as Product).isActive !== false);
  },
};
