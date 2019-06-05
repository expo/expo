import { Platform } from 'react-native';
import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { QueryResponse } from './InAppPurchases.types';

const validTypes = {
  INAPP: 'inapp',
  SUBS: 'subs',
}

const { responseCodes, purchaseStates } = ExpoInAppPurchases;

export const constants = {
  responseCodes,
  purchaseStates,
  validTypes,
}

const errors = {
  ALREADY_CONNECTED: 'Already connected to App Store',
  ALREADY_DISCONNECTED: 'Already disconnected from App Store',
  NOT_CONNECTED: 'Must be connected to App Store',
};

let connected = false;

export async function connectAsync(): Promise<QueryResponse> {
  console.log('calling connectToAppStoreAsync from TS');
  if (connected) {
    throw new ConnectionError(errors.ALREADY_CONNECTED);
  }

  connected = true;
  return await ExpoInAppPurchases.connectAsync();
}

export async function getProductsAsync(itemList: string[]): Promise<QueryResponse> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!connected) {
    throw new ConnectionError(errors.NOT_CONNECTED);
  }
  if (Platform.OS === 'android') {
    // On Android you have to pass in the item type so we will combine the results of both inapp and subs
    const { responseCode, results } = await ExpoInAppPurchases.getProductsAsync(validTypes.INAPP, itemList);
    if (responseCode == responseCodes.OK) {
      const subs = await ExpoInAppPurchases.getProductsAsync(validTypes.SUBS, itemList);
      subs.results.forEach(result => {
        results.push(result);
      });
    }
    return { responseCode, results };
  }

  return await ExpoInAppPurchases.getProductsAsync(itemList);
}

export async function getPurchaseHistoryAsync(refresh?: boolean): Promise<QueryResponse> {
  console.log('calling queryPurchaseHistoryAsync from TS');
  if (!connected) {
    throw new ConnectionError(errors.NOT_CONNECTED);
  }
  if (refresh && Platform.OS === 'android') {
    const { responseCode, results } = await ExpoInAppPurchases.getPurchaseHistoryAsync(validTypes.INAPP);
    if (responseCode === responseCodes.OK) {
      const subs = await ExpoInAppPurchases.getPurchaseHistoryAsync(validTypes.SUBS);
      subs.results.forEach(result => {
        results.push(result);
      });
    }
    return { responseCode, results };
  }
  return await ExpoInAppPurchases.getPurchaseHistoryAsync(null);
}

export async function purchaseItemAsync(itemId: string, oldItem?: string): Promise<QueryResponse> {
  console.log('calling purchaseItemAsync from TS');
  if (!connected) {
    throw new ConnectionError(errors.NOT_CONNECTED);
  }

  // Replacing old item is only supported on Android
  const args = Platform.OS === 'android' ? [itemId, oldItem] : [itemId];
  return await ExpoInAppPurchases.purchaseItemAsync(...args);
}

export async function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void> {
  // No-op if not on Android since this is not applicable
  if (!ExpoInAppPurchases.acknowledgePurchaseAsync) return;
  console.log('calling acknowledgePurchaseAsync from TS');
  if (!connected) {
    throw new ConnectionError(errors.NOT_CONNECTED);
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
    return responseCodes.SERVICE_DISCONNECTED;
  }
  if (!ExpoInAppPurchases.getBillingResponseCodeAsync) {
    return responseCodes.OK;
  }

  return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}

export async function disconnectAsync(): Promise<void> {
  if (!connected) {
    throw new ConnectionError(errors.ALREADY_DISCONNECTED);
  }
  connected = false;
  return await ExpoInAppPurchases.disconnectAsync();
}

class ConnectionError extends CodedError {
  constructor(message: string) {
    super('ERR_Connection', message);
  }
}