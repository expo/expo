export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
declare type ValidItemType = 'inapp' | 'subs';
export declare function connectToAppStoreAsync(): Promise<any>;
export declare function queryPurchasableItemsAsync(itemType: ValidItemType, itemList: string[]): Promise<any>;
export declare function initiatePurchaseFlowAsync(itemId: String, oldItem?: String): Promise<any>;
