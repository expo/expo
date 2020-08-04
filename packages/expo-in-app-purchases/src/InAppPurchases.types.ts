export interface IAPQueryResponse {
  responseCode: IAPResponseCode;
  results?: (InAppPurchase | IAPItemDetails)[];
  errorCode?: IAPErrorCode;
}

export enum IAPResponseCode {
  OK = 0,
  USER_CANCELED = 1,
  ERROR = 2,
  DEFERRED = 3,
}

export enum InAppPurchaseState {
  PURCHASING = 0,
  PURCHASED = 1,
  FAILED = 2,
  RESTORED = 3,
  DEFERRED = 4,
}

export enum IAPErrorCode {
  UNKNOWN = 0,
  PAYMENT_INVALID = 1,
  SERVICE_DISCONNECTED = 2,
  SERVICE_UNAVAILABLE = 3,
  SERVICE_TIMEOUT = 4,
  BILLING_UNAVAILABLE = 5,
  ITEM_UNAVAILABLE = 6,
  DEVELOPER_ERROR = 7,
  ITEM_ALREADY_OWNED = 8,
  ITEM_NOT_OWNED = 9,
  CLOUD_SERVICE = 10,
  PRIVACY_UNACKNOWLEDGED = 11,
  UNAUTHORIZED_REQUEST = 12,
  INVALID_IDENTIFIER = 13,
  MISSING_PARAMS = 14,
}

export enum IAPItemType {
  PURCHASE = 0,
  SUBSCRIPTION = 1,
}

export interface InAppPurchase {
  acknowledged: boolean;
  productId: string;
  purchaseState: number;
  purchaseTime: number;
  orderId: string;
  packageName?: string; // Android only
  purchaseToken?: string; // Android only
  originalOrderId?: string; // iOS only
  originalPurchaseTime?: string; // iOS only
  transactionReceipt?: string; // iOS only
}
export interface IAPItemDetails {
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  productId: string;
  title: string;
  type: IAPItemType;
  subscriptionPeriod?: string;
}
