export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
declare type ValidItemType = 'inapp' | 'subs';
interface QueryResponse {
    responseCode: Number;
    results: Array<object>;
}
export declare const events: {
    PURCHASES_UPDATED: string;
    ITEM_ACKNOWLEDGED: string;
};
export declare const billingResponseCodes: any;
export declare const purchaseStates: any;
export declare function connectToAppStoreAsync(): Promise<QueryResponse>;
export declare function queryPurchasableItemsAsync(itemType: ValidItemType, itemList: string[]): Promise<QueryResponse>;
export declare function purchaseItemAsync(itemId: String, oldItem?: String): Promise<void>;
export declare function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: Boolean): Promise<void>;
export declare function setPurchaseListener(eventName: string, callback: (result: any) => void): void;
export declare function disconnectAsync(): Promise<void>;
export declare function getBillingResponseCodeAsync(): Promise<Number>;
