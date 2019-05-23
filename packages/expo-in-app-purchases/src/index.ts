import { NativeModulesProxy, CodedError, EventEmitter } from '@unimodules/core';
const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

type ValidItemType = 'inapp' | 'subs';
interface QueryResponse {
  responseCode: Number,
  results: Array<object>,
}

const EVENTS = {
  purchasesUpdated: 'Purchases Updated',
  itemAcknowledged: 'Item Acknowledged',
  itemConsumed: 'Item Consumed'
}

let connected = false;
const eventEmitter = new EventEmitter(ExpoInAppPurchases);

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

export async function purchaseItemAsync(itemId: String, oldItem?: String): Promise<QueryResponse> {
  console.log('calling purchaseItemAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);

  const result = await getResultFromListener(EVENTS.purchasesUpdated);
  return convertStringsToObjects(result);
}

export async function acknowledgePurchaseAsync(purchaseToken: string): Promise<Number> {
  console.log('calling acknowledgePurchaseAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  await ExpoInAppPurchases.acknowledgePurchaseAsync(purchaseToken);

  const { responseCode } = await getResultFromListener(EVENTS.itemAcknowledged);
  return responseCode;
}

export async function consumeAsync(purchaseToken: string): Promise<Number> {
  console.log('calling consumeAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  await ExpoInAppPurchases.consumeAsync(purchaseToken);

  const { responseCode } = await getResultFromListener(EVENTS.itemConsumed);
  return responseCode;
}

async function getResultFromListener(eventName: string): Promise<any> {
  return new Promise(resolve => {
    eventEmitter.addListener<Object>(eventName, result => {
      eventEmitter.removeAllListeners(eventName);
      resolve(result);
    })
  });
}

export async function disconnectAsync(): Promise<void> {
  console.log('calling disconnectAsync from TS');
  if (!connected) {
    throw new ConnectionError('Already disconnected from App Store');
  }
  connected = false;

  return await ExpoInAppPurchases.disconnectAsync();
}

export async function getBillingResponseCodeAsync(): Promise<Number> {
  if (!connected) {
    return -1;
  }

  return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}

function convertStringsToObjects(response : any) {
  const { responseCode, results: jsonStrings } = response;
  const results = jsonStrings ? jsonStrings.map(string => JSON.parse(string)) : [];
  return { responseCode, results };
}

class ConnectionError extends CodedError {
  constructor(message: string) {
    super('ERR_Connection', message);
  }
}