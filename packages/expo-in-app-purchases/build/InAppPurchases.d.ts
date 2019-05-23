export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
declare type ValidItemType = 'inapp' | 'subs';
interface QueryResponse {
    responseCode: number;
    results: Array<Purchase | ItemDetails>;
}
interface Purchase {
    acknowledged: boolean;
    orderId: string;
    packageName: string;
    productId: string;
    purchaseState: number;
    purchaseTime: number;
    purchaseToken: string;
}
interface ItemDetails {
    description: string;
    price: string;
    price_amount_micros: number;
    price_currency_code: string;
    productId: string;
    skuDetailsToken: string;
    title: string;
    type: ValidItemType;
}
export declare const events: {
    PURCHASES_UPDATED: string;
    ITEM_ACKNOWLEDGED: string;
};
export declare const billingResponseCodes: any;
export declare const purchaseStates: any;
export declare function connectToAppStoreAsync(): Promise<QueryResponse>;
export declare function queryPurchasableItemsAsync(itemType: ValidItemType, itemList: string[]): Promise<QueryResponse>;
export declare function purchaseItemAsync(itemId: string, oldItem?: string): Promise<void>;
export declare function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void>;
export declare function setPurchaseListener(eventName: string, callback: (result: any) => void): void;
export declare function disconnectAsync(): Promise<void>;
export declare function getBillingResponseCodeAsync(): Promise<number>;
