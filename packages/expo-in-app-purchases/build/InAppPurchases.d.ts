import { QueryResponse } from './InAppPurchases.types';
export declare const constants: {
    responseCodes: any;
    purchaseStates: any;
    validTypes: {
        INAPP: string;
        SUBS: string;
    };
};
export declare function connectAsync(): Promise<QueryResponse>;
export declare function getProductsAsync(itemList: string[]): Promise<QueryResponse>;
export declare function getPurchaseHistoryAsync(refresh?: boolean): Promise<QueryResponse>;
export declare function purchaseItemAsync(itemId: string, oldItem?: string): Promise<QueryResponse>;
export declare function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void>;
export declare function getBillingResponseCodeAsync(): Promise<number>;
export declare function disconnectAsync(): Promise<void>;
