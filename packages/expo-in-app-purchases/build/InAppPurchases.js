import { CodedError, EventEmitter } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
export const events = {
    PURCHASES_UPDATED: 'Purchases Updated',
    ITEM_ACKNOWLEDGED: 'Item Acknowledged',
};
let connected = false;
let purchasesUpdateSubscription;
let itemAcknowledgedSubscription;
const eventEmitter = new EventEmitter(ExpoInAppPurchases);
export const billingResponseCodes = ExpoInAppPurchases.responseCodes;
export const purchaseStates = ExpoInAppPurchases.purchaseStates;
export async function connectToAppStoreAsync() {
    console.log('calling connectToAppStoreAsync from TS');
    if (connected) {
        throw new ConnectionError('Already connected to App Store');
    }
    connected = true;
    const response = await ExpoInAppPurchases.connectToAppStoreAsync();
    return convertStringsToObjects(response);
}
export async function queryPurchasableItemsAsync(itemType, itemList) {
    console.log('calling queryPurchasableItemsAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
    return convertStringsToObjects(response);
}
export async function purchaseItemAsync(itemId, oldItem) {
    console.log('calling purchaseItemAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    return await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
}
export async function acknowledgePurchaseAsync(purchaseToken, consumeItem) {
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
export function setPurchaseListener(eventName, callback) {
    if (eventName === events.PURCHASES_UPDATED) {
        if (purchasesUpdateSubscription) {
            purchasesUpdateSubscription.remove();
        }
        purchasesUpdateSubscription = eventEmitter.addListener(eventName, result => {
            callback(convertStringsToObjects(result));
        });
    }
    else if (eventName === events.ITEM_ACKNOWLEDGED) {
        if (itemAcknowledgedSubscription) {
            itemAcknowledgedSubscription.remove();
        }
        itemAcknowledgedSubscription = eventEmitter.addListener(eventName, callback);
    }
}
export async function disconnectAsync() {
    console.log('calling disconnectAsync from TS');
    if (!connected) {
        throw new ConnectionError('Already disconnected from App Store');
    }
    connected = false;
    for (const key in events) {
        console.log('Removing listeners for ' + events[key]);
        eventEmitter.removeAllListeners(events[key]);
    }
    return await ExpoInAppPurchases.disconnectAsync();
}
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return billingResponseCodes.SERVICE_DISCONNECTED;
    }
    return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}
function convertStringsToObjects(response) {
    const { responseCode, results: jsonStrings } = response;
    const results = jsonStrings ? jsonStrings.map(string => JSON.parse(string)) : [];
    return { responseCode, results };
}
class ConnectionError extends CodedError {
    constructor(message) {
        super('ERR_Connection', message);
    }
}
//# sourceMappingURL=InAppPurchases.js.map