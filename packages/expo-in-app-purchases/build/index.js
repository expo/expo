import { NativeModulesProxy } from '@unimodules/core';
const { ExpoInAppPurchases } = NativeModulesProxy;
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
let connected = false;
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
export async function initiatePurchaseFlowAsync(itemId, oldItem) {
    console.log('calling initiatePurchaseFlowAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    return await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
}
export async function disconnectAsync() {
    console.log('calling disconnectAsync from TS');
    if (!connected) {
        throw new ConnectionError('Already disconnected from App Store');
    }
    connected = false;
    return await ExpoInAppPurchases.disconnectAsync();
}
function convertStringsToObjects(response) {
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
//# sourceMappingURL=index.js.map