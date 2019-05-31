export type ValidItemType = 'inapp' | 'subs';

export interface QueryResponse {
  responseCode: number,
  results: Array<Purchase | ItemDetails>,
}

export interface Purchase {
  acknowledged: boolean,
  orderId: string,
  packageName: string,
  productId: string,
  purchaseState: number,
  purchaseTime: number,
  purchaseToken?: string // Android only
  transactionReceipt?: string // iOS only
}

export interface ItemDetails {
  description: string,
  price: string,
  price_amount_micros: number,
  price_currency_code: string,
  productId: string,
  title: string,
  type: ValidItemType,
  skuDetailsToken?: string // Android only
}