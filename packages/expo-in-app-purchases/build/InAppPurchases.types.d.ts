export declare type ValidItemType = 'inapp' | 'subs';
export interface QueryResponse {
    responseCode: ResponseCode;
    results: Array<Purchase | ItemDetails>;
    errorCode?: ErrorCode;
}
export declare enum ResponseCode {
    OK = 0,
    USER_CANCELED = 1,
    ERROR = 2
}
export declare enum ErrorCode {
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
    UNATHORIZED_REQUEST = 12,
    INVALID_IDENTIFIER = 13,
    MISSING_PARAMS = 14
}
export interface Purchase {
    acknowledged: boolean;
    productId: string;
    purchaseToken: string;
    purchaseState: number;
    purchaseTime: number;
    orderId?: string;
    packageName?: string;
    transactionReceipt?: string;
}
export interface ItemDetails {
    description: string;
    price: string;
    priceAmountMicros: number;
    priceCurrencyCode: string;
    productId: string;
    title: string;
    type: ValidItemType;
    subscriptionPeriod?: string;
}
