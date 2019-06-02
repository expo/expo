import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { Platform } from 'react-native';
import {
  ValidItemType,
  QueryResponse
} from './InAppPurchases.types';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

const validTypes = {
  INAPP: 'inapp',
  SUBS: 'subs',
}
const billingResponseCodes = ExpoInAppPurchases.responseCodes;
const purchaseStates = ExpoInAppPurchases.purchaseStates;

export const constants = {
  billingResponseCodes,
  purchaseStates,
  validTypes,
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

export async function queryPurchasableItemsAsync(itemList: string[]): Promise<QueryResponse> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }
  if (Platform.OS === 'android') {
    // On Android you have to pass in the item type so we will combine the results of both inapp and subs
    const { responseCode, results } = await ExpoInAppPurchases.queryPurchasableItemsAsync(validTypes.INAPP, itemList);
    if (responseCode == billingResponseCodes.OK) {
      const subs = await ExpoInAppPurchases.queryPurchasableItemsAsync(validTypes.SUBS, itemList);
      subs.results.forEach(result => {
        results.push(result);
      });
    }
    const response = { responseCode, results };
    return convertStringsToObjects(response);
  }

  const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemList);
  return convertStringsToObjects(response);
}

export async function queryPurchaseHistoryAsync(refresh?: boolean, itemType?: ValidItemType): Promise<QueryResponse> {
  console.log('calling queryPurchaseHistoryAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }
  if (refresh && !itemType) {
    throw new Error('Must define item type if querying updated history');
  }
  const history = await ExpoInAppPurchases.queryPurchaseHistoryAsync(refresh ? itemType : null);
  return convertStringsToObjects(history);
}

export async function purchaseItemAsync(itemId: string, oldItem?: string): Promise<QueryResponse> {
  console.log('calling purchaseItemAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  const response = await ExpoInAppPurchases.purchaseItemAsync(itemId, oldItem);
  return convertStringsToObjects(response);
}

export async function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void> {
  console.log('calling acknowledgePurchaseAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  if (consumeItem) {
    console.log('Consuming...');
    return await ExpoInAppPurchases.consumeAsync(purchaseToken);
  }
  console.log('Acknowledging...');
  return await ExpoInAppPurchases.acknowledgePurchaseAsync(purchaseToken);
}

export async function getBillingResponseCodeAsync(): Promise<number> {
  if (!connected) {
    return billingResponseCodes.SERVICE_DISCONNECTED;
  }
  if (Platform.OS !== 'android') {
    return billingResponseCodes.OK;
  }

  return await ExpoInAppPurchases.getBillingResponseCodeAsync();
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
  if (Platform.OS !== 'android') {
    return response;
  }
  // Android returns stringified JSON objects
  const { responseCode, results: jsonStrings } = response;
  const results = jsonStrings ? jsonStrings.map(string => JSON.parse(string)) : [];
  return { responseCode, results };
}

class ConnectionError extends CodedError {
  constructor(message: string) {
    super('ERR_Connection', message);
  }
}