// Currency calculation and exchange rate engine for Cambodia

export const NBC_EXCHANGE_RATE = 4100.0; // Standard National Bank of Cambodia rate

export interface CurrencyCalculation {
  currency: 'KHR' | 'USD';
  rate: number;
  total: number;
  amountExclVat: number;
  vat: number;
  totalBaseKhr: number;
}

/**
 * Calculates standard Cambodian VAT (10%) and base KHR equivalent
 */
export function calculateReceiptAmounts(
  total: number,
  currency: 'KHR' | 'USD',
  isVatIncluded: boolean = false,
  customRate: number = NBC_EXCHANGE_RATE
): CurrencyCalculation {
  const rate = currency === 'KHR' ? 1.0 : customRate;
  
  let amountExclVat = 0;
  let vat = 0;

  if (isVatIncluded) {
    // 10% VAT included: Pre-tax = Total / 1.10, VAT = Total - Pre-tax
    amountExclVat = Math.round((total / 1.1) * 100) / 100;
    vat = Math.round((total - amountExclVat) * 100) / 100;
  } else {
    amountExclVat = total;
    vat = 0;
  }

  // Convert to KHR equivalent
  const totalBaseKhr = currency === 'KHR' ? total : Math.round(total * rate);

  return {
    currency,
    rate,
    total,
    amountExclVat,
    vat,
    totalBaseKhr,
  };
}

/**
 * Format currency with symbols
 */
export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${Math.round(amount).toLocaleString('en-US')} ៛`;
}
