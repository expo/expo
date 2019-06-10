import { QueryResponse, ResponseCode, ErrorCode } from './InAppPurchases.types';
export { ResponseCode, ErrorCode, };
export declare function connectAsync(): Promise<QueryResponse>;
export declare function getProductsAsync(itemList: string[]): Promise<QueryResponse>;
export declare function getPurchaseHistoryAsync(refresh?: boolean): Promise<QueryResponse>;
export declare function purchaseItemAsync(itemId: string, oldItem?: string): Promise<QueryResponse>;
export declare function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void>;
export declare function getBillingResponseCodeAsync(): Promise<number>;
export declare function disconnectAsync(): Promise<void>;
