import { NativeModulesProxy } from '@unimodules/core';
const { ExpoInAppPurchases } = NativeModulesProxy;
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
let connected = false;
export async function connectToAppStoreAsync() {
    console.log('calling connectToAppStoreAsync from TS');
    if (connected) {
        throw new Error('Cannot connect twice!');
    }
    connected = true;
    const response = await ExpoInAppPurchases.connectToAppStoreAsync();
    return convertStringsToObjects(response);
}
export async function queryPurchasableItemsAsync(itemType, itemList) {
    console.log('calling queryPurchasableItemsAsync from TS');
    if (!connected) {
        throw new Error('Must connect to app store first!');
    }
    const response = await ExpoInAppPurchases.queryPurchasableItemsAsync(itemType, itemList);
    return convertStringsToObjects(response);
}
export async function initiatePurchaseFlowAsync(itemId, oldItem) {
    console.log('calling initiatePurchaseFlowAsync from TS');
    if (!connected) {
        throw new Error('Must be connected!');
    }
    return await ExpoInAppPurchases.initiatePurchaseFlowAsync(itemId, oldItem);
}
function convertStringsToObjects(response) {
    const { responseCode, results: jsonStrings } = response;
    const results = jsonStrings.map(string => JSON.parse(string));
    return { responseCode, results };
}
//# sourceMappingURL=index.js.map