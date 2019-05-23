import { CodedError, EventEmitter, Subscription } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

type ValidItemType = 'inapp' | 'subs';
interface QueryResponse {
  responseCode: number,
  results: Array<Purchase | ItemDetails>,
}

interface Purchase {
  acknowledged: boolean,
  orderId: string,
  packageName: string,
  productId: string,
  purchaseState: number,
  purchaseTime: number,
  purchaseToken: string
}

interface ItemDetails {
  description: string,
  price: string,
  price_amount_micros: number,
  price_currency_code: string,
  productId: string,
  skuDetailsToken: string,
  title: string,
  type: ValidItemType
}

const events = {
  PURCHASES_UPDATED: 'Purchases Updated',
  ITEM_ACKNOWLEDGED: 'Item Acknowledged',
}
const validTypes = {
  INAPP: 'inapp',
  SUBS: 'subs',
}
const billingResponseCodes = ExpoInAppPurchases.responseCodes;
const purchaseStates = ExpoInAppPurchases.purchaseStates;

export const constants = {
  events,
  billingResponseCodes,
  purchaseStates,
  validTypes,
}

let connected = false;
let purchasesUpdateSubscription: Subscription;
let itemAcknowledgedSubscription: Subscription;
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

export async function purchaseItemAsync(itemId: string, oldItem?: string): Promise<void> {
  console.log('calling purchaseItemAsync from TS');
  if (!connected) {
    throw new ConnectionError('Must be connected to App Store');
  }

  return await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
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

export function setPurchaseListener(eventName: string, callback: (result) => void): void {
  if (eventName === events.PURCHASES_UPDATED) {
    if (purchasesUpdateSubscription) {
      purchasesUpdateSubscription.remove();
    }

    purchasesUpdateSubscription = eventEmitter.addListener<QueryResponse>(eventName, result => {
      callback(convertStringsToObjects(result));
    });
  } else if (eventName === events.ITEM_ACKNOWLEDGED) {
    if (itemAcknowledgedSubscription) {
      itemAcknowledgedSubscription.remove();
    }
    itemAcknowledgedSubscription = eventEmitter.addListener<number>(eventName, callback);
  }
}

export async function getBillingResponseCodeAsync(): Promise<number> {
  if (!connected) {
    return billingResponseCodes.SERVICE_DISCONNECTED;
  }

  return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}

export async function disconnectAsync(): Promise<void> {
  console.log('calling disconnectAsync from TS');
  if (!connected) {
    throw new ConnectionError('Already disconnected from App Store');
  }
  connected = false;

  for(const key in events) {
    console.log('Removing listeners for ' + events[key]);
    eventEmitter.removeAllListeners(events[key]);
  }

  return await ExpoInAppPurchases.disconnectAsync();
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