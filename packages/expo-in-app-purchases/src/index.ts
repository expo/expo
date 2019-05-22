import { NativeModulesProxy } from '@unimodules/core';

const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

type ValidItemType = 'inapp' | 'subs';
interface QueryResponse {
  responseCode: Number,
  results: Array<object>,
}

let connected = false;

export async function connectToAppStoreAsync(): Promise<QueryResponse> {
  console.log('calling connectToAppStoreAsync from TS');
  if (connected) {
    throw new ConnectionError('Already connected to App Store');
  }

  connected = true;
  const response = await ExpoInAppPurchases.connectToAppStoreAsync();
  return convertStringsToObjects(response);
}

export async function queryPurchasableItemsAsync(itemType: ValidItemType, itemList: string[]): Promise<QueryResponse> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
  return convertStringsToObjects(response);
}

export async function initiatePurchaseFlowAsync(itemId: String, oldItem?: String): Promise<void> {
  console.log('calling initiatePurchaseFlowAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  return await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
}

export async function disconnectAsync(): Promise<void> {
  console.log('calling disconnectAsync from TS');
  if (!connected) {
    throw new ConnectionError('Already disconnected from App Store');
  }
  connected = false;

  return await ExpoInAppPurchases.disconnectAsync();
}

function convertStringsToObjects(response : any) {
  const { responseCode, results: jsonStrings } = response;
  const results = jsonStrings.map(string => JSON.parse(string));
  return { responseCode, results };
}
 class ConnectionError extends Error {
  constructor(...args) {
    super(...args);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError);
    }
    this.name = 'ConnectionError';
  }
}