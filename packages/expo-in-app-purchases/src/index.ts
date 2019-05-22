import { NativeModulesProxy } from '@unimodules/core';

const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

type ValidItemType = 'inapp' | 'subs';

let connected = false;

export async function connectToAppStoreAsync(): Promise<any> {
  console.log('calling connectToAppStoreAsync from TS');
  if (connected) {
    throw new Error('Cannot connect twice!');
  }

  connected = true;
  const response = await ExpoInAppPurchases.connectToAppStoreAsync();
  return convertStringsToObjects(response);
}

export async function queryPurchasableItemsAsync(itemType: ValidItemType, itemList: string[]): Promise<any> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!connected) {
    throw new Error('Must connect to app store first!');
  }

  const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
  return convertStringsToObjects(response);
}

export async function initiatePurchaseFlowAsync(itemId: String, oldItem?: String): Promise<any> {
  console.log('calling initiatePurchaseFlowAsync from TS');
  if (!connected) {
    throw new Error('Must be connected!');
  }

  return await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
}

function convertStringsToObjects(response : any) {
  const { responseCode, results: jsonStrings } = response;
  const results = jsonStrings.map(string => JSON.parse(string));
  return { responseCode, results };
}
