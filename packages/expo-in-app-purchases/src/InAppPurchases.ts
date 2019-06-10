import { Platform } from 'react-native';
import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { QueryResponse, ResponseCode, ErrorCode } from './InAppPurchases.types';

const validTypes = {
  INAPP: 'inapp',
  SUBS: 'subs',
}

export {
  ResponseCode,
  ErrorCode,
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

  const result = await ExpoInAppPurchases.connectAsync();
  connected = true;
  return result;
}

export async function getProductsAsync(itemList: string[]): Promise<QueryResponse> {
  if (!connected) {
    throw new ConnectionError(errors.NOT_CONNECTED);
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
    if (responseCode === ResponseCode.OK) {
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
    return ResponseCode.ERROR;
  }
  if (!ExpoInAppPurchases.getBillingResponseCodeAsync) {
    return ResponseCode.OK;
  }

  return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}

export async function disconnectAsync(): Promise<void> {
  if (!connected) {
    throw new ConnectionError(errors.ALREADY_DISCONNECTED);
  }
  await ExpoInAppPurchases.disconnectAsync();
  connected = false;
}

class ConnectionError extends CodedError {
  constructor(message: string) {
    super('ERR_IN_APP_PURCHASES_CONNECTION', message);
  }
}