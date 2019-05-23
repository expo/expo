import { NativeModulesProxy, CodedError, EventEmitter } from '@unimodules/core';
const { ExpoInAppPurchases } = NativeModulesProxy;
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
const EVENTS = {
    purchasesUpdated: 'Purchases Updated',
    itemAcknowledged: 'Item Acknowledged',
    itemConsumed: 'Item Consumed'
};
let connected = false;
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
    await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
    const result = await getResultFromListener(EVENTS.purchasesUpdated);
    return convertStringsToObjects(result);
}
export async function acknowledgePurchaseAsync(purchaseToken) {
    console.log('calling acknowledgePurchaseAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    await ExpoInAppPurchases.acknowledgePurchaseAsync(purchaseToken);
    const { responseCode } = await getResultFromListener(EVENTS.itemAcknowledged);
    return responseCode;
}
export async function consumeAsync(purchaseToken) {
    console.log('calling consumeAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    await ExpoInAppPurchases.consumeAsync(purchaseToken);
    return await getResultFromListener(EVENTS.itemConsumed);
}
async function getResultFromListener(eventName) {
    return new Promise(resolve => {
        eventEmitter.addListener(eventName, result => {
            eventEmitter.removeAllListeners(eventName);
            resolve(result);
        });
    });
}
export async function disconnectAsync() {
    console.log('calling disconnectAsync from TS');
    if (!connected) {
        throw new ConnectionError('Already disconnected from App Store');
    }
    connected = false;
    return await ExpoInAppPurchases.disconnectAsync();
}
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return -1;
    }
    return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}
function convertStringsToObjects(response) {
    const { responseCode, results: jsonStrings } = response;
    const results = jsonStrings.map(string => JSON.parse(string));
    return { responseCode, results };
}
class ConnectionError extends CodedError {
    constructor(message) {
        super('ERR_Connection', message);
    }
}
//# sourceMappingURL=index.js.map