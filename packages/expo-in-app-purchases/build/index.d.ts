export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
declare type ValidItemType = 'inapp' | 'subs';
interface QueryResponse {
    responseCode: Number;
    results: Array<object>;
}
export declare function connectToAppStoreAsync(): Promise<QueryResponse>;
export declare function queryPurchasableItemsAsync(itemType: ValidItemType, itemList: string[]): Promise<QueryResponse>;
export declare function purchaseItemAsync(itemId: String, oldItem?: String): Promise<QueryResponse>;
export declare function acknowledgePurchaseAsync(purchaseToken: string): Promise<Number>;
export declare function disconnectAsync(): Promise<void>;
export declare function getBillingResponseCodeAsync(): Promise<Number>;
