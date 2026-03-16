/**
 * Bulk discount for volume-based GB products (matches old UI formula).
 * When quantity >= lastPackageMinGB, discount applies: Total = quantity × basePrice × (1 − discount/100).
 */
export interface BulkDiscountInput {
  selectedGB: number;
  lastPackageMinGB: number;
  basePrice: number;
  bulkDiscountMaxPercent?: number;
  bulkDiscountCoefficient?: number;
  bulkDiscountExponent?: number;
}

export interface BulkDiscountResult {
  totalCost: number;
  discountPercent: number;
  pricePerGBWithDiscount: number;
}

const DEFAULT_MAX_PERCENT = 30;
const DEFAULT_COEFF = 30 / Math.pow(10, 1.27);
const DEFAULT_EXP = 1.27;

export function calculateBulkDiscount(input: BulkDiscountInput): BulkDiscountResult {
  const {
    selectedGB,
    lastPackageMinGB,
    basePrice,
    bulkDiscountMaxPercent = DEFAULT_MAX_PERCENT,
    bulkDiscountCoefficient = DEFAULT_COEFF,
    bulkDiscountExponent = DEFAULT_EXP,
  } = input;
  const bulkGB = Math.max(0, selectedGB - lastPackageMinGB);

  let discountPercent = 0;
  let totalCost: number;

  if (bulkGB > 0 && lastPackageMinGB > 0) {
    discountPercent = Math.min(
      bulkDiscountMaxPercent,
      bulkDiscountCoefficient * Math.pow(bulkGB / lastPackageMinGB, bulkDiscountExponent)
    );
    const discountedPricePerUnit = basePrice * (1 - discountPercent / 100);
    totalCost = selectedGB * discountedPricePerUnit;
  } else {
    totalCost = selectedGB * basePrice;
  }

  const pricePerGBWithDiscount = selectedGB > 0 ? totalCost / selectedGB : basePrice;
  return {
    totalCost,
    discountPercent: Math.round(discountPercent * 10) / 10,
    pricePerGBWithDiscount,
  };
}
