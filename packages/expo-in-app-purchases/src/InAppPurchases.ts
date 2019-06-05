import { Platform } from 'react-native';
import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { QueryResponse } from './InAppPurchases.types';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

const validTypes = {
  INAPP: 'inapp',
  SUBS: 'subs',
}
const { billingResponseCodes, purchaseStates } = ExpoInAppPurchases;

export const constants = {
  billingResponseCodes,
  purchaseStates,
  validTypes,
}

let connected = false;

export async function connectAsync(): Promise<QueryResponse> {
  console.log('calling connectToAppStoreAsync from TS');
  if (connected) {
    throw new ConnectionError('Already connected to App Store');
  }

  connected = true;
  return await ExpoInAppPurchases.connectAsync();
}

export async function getProductsAsync(itemList: string[]): Promise<QueryResponse> {
  console.log('calling queryPurchasableItemsAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }
  if (Platform.OS === 'android') {
    // On Android you have to pass in the item type so we will combine the results of both inapp and subs
    const { responseCode, results } = await ExpoInAppPurchases.getProductsAsync(validTypes.INAPP, itemList);
    if (responseCode == billingResponseCodes.OK) {
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
    throw new ConnectionError('Must be connected to App Store');
  }
  if (refresh && Platform.OS === 'android') {
    const { responseCode, results } = await ExpoInAppPurchases.getPurchaseHistoryAsync(validTypes.INAPP);
    if (responseCode === billingResponseCodes.OK) {
      const subs = await await ExpoInAppPurchases.getPurchaseHistoryAsync(validTypes.SUBS);
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
    throw new ConnectionError('Must be connected to App Store');
  }

  // Replacing old item is only supported on Android
  const args = Platform.OS === 'android' ? [itemId, oldItem] : [itemId];
  return await ExpoInAppPurchases.purchaseItemAsync(...args);
}

export async function acknowledgePurchaseAsync(purchaseToken: string, consumeItem: boolean): Promise<void> {
  // No-op if not on Android since this is not applicable
  if (Platform.OS !== 'android') return;
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

class ConnectionError extends CodedError {
  constructor(message: string) {
    super('ERR_Connection', message);
  }
}