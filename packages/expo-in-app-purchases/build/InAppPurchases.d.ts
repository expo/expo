import { ValidItemType, QueryResponse } from './InAppPurchases.types';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
export declare const constants: {
    billingResponseCodes: any;
    purchaseStates: any;
    validTypes: {
        INAPP: string;
        SUBS: string;
    };
};
export declare function connectToAppStoreAsync(): Promise<QueryResponse>;
export declare function queryPurchasableItemsAsync(itemList: string[]): Promise<QueryResponse>;
export declare function queryPurchaseHistoryAsync(refresh?: boolean, itemType?: ValidItemType): Promise<QueryResponse>;
export declare function purchaseItemAsync(itemId: string, oldItem?: string): Promise<QueryResponse>;
export declare function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void>;
export declare function getBillingResponseCodeAsync(): Promise<number>;
export declare function disconnectAsync(): Promise<void>;
