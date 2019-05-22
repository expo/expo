import { NativeModulesProxy } from '@unimodules/core';

const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

const VALID_TYPES: string[] = ['subs', 'inapp'];

export async function queryPurchasableItemsAsync(itemType: string, itemList: string[]): Promise<any> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!VALID_TYPES.includes(itemType)) {
    return new Error('Invalid type!');
  }
  return await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
}
