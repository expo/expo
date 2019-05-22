import { NativeModulesProxy } from '@unimodules/core';

const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

const VALID_TYPES: string[] = ['subs', 'inapp'];

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

export async function queryPurchasableItemsAsync(itemType: string, itemList: string[]): Promise<any> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!connected) {
    throw new Error('Must connect to app store first!');
  }
  if (!VALID_TYPES.includes(itemType)) {
    throw new Error('Invalid type!');
  }
  const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
  return convertStringsToObjects(response);
}

function convertStringsToObjects(response : any) {
  const { responseCode, results: jsonStrings } = response;
  const results = jsonStrings.map(string => JSON.parse(string));
  return { responseCode, results };
}
