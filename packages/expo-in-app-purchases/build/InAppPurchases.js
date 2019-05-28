import { CodedError, EventEmitter } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { Platform } from 'react-native';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
const events = {
    PURCHASES_UPDATED: 'Purchases Updated',
    ITEM_ACKNOWLEDGED: 'Item Acknowledged',
};
const validTypes = {
    INAPP: 'inapp',
    SUBS: 'subs',
};
const billingResponseCodes = ExpoInAppPurchases.responseCodes;
const purchaseStates = ExpoInAppPurchases.purchaseStates;
export const constants = {
    events,
    billingResponseCodes,
    purchaseStates,
    validTypes,
};
let connected = false;
let purchasesUpdateSubscription;
let itemAcknowledgedSubscription;
const eventEmitter = new EventEmitter(ExpoInAppPurchases);
export async function connectToAppStoreAsync() {
    console.log('calling connectToAppStoreAsync from TS');
    if (connected) {
        throw new ConnectionError('Already connected to App Store');
    }
    connected = true;
    const response = await ExpoInAppPurchases.connectToAppStoreAsync();
    return convertStringsToObjects(response);
}
export async function queryPurchasableItemsAsync(itemList, itemType) {
    console.log('calling queryPurchasableItemsAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    if (Platform.OS === 'ios') {
        const response = ExpoInAppPurchases.queryPurchasableItemsAsync(itemList);
        return response;
    }
    const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
    return convertStringsToObjects(response);
}
export async function queryPurchaseHistoryAsync(refresh, itemType) {
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
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return billingResponseCodes.SERVICE_DISCONNECTED;
    }
    return await ExpoInAppPurchases.getBillingResponseCodeAsync();
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