import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { Platform } from 'react-native';
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
const validTypes = {
    INAPP: 'inapp',
    SUBS: 'subs',
};
const billingResponseCodes = ExpoInAppPurchases.responseCodes;
const purchaseStates = ExpoInAppPurchases.purchaseStates;
export const constants = {
    billingResponseCodes,
    purchaseStates,
    validTypes,
};
let connected = false;
export async function connectToAppStoreAsync() {
    console.log('calling connectToAppStoreAsync from TS');
    if (connected) {
        throw new ConnectionError('Already connected to App Store');
    }
    connected = true;
    return await ExpoInAppPurchases.connectToAppStoreAsync();
}
export async function queryPurchasableItemsAsync(itemList) {
    console.log('calling queryPurchasableItemsAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    if (Platform.OS === 'android') {
        // On Android you have to pass in the item type so we will combine the results of both inapp and subs
        const { responseCode, results } = await ExpoInAppPurchases.queryPurchasableItemsAsync(validTypes.INAPP, itemList);
        if (responseCode == billingResponseCodes.OK) {
            const subs = await ExpoInAppPurchases.queryPurchasableItemsAsync(validTypes.SUBS, itemList);
            subs.results.forEach(result => {
                results.push(result);
            });
        }
        return { responseCode, results };
    }
    return await ExpoInAppPurchases.queryPurchasableItemsAsync(itemList);
}
export async function queryPurchaseHistoryAsync(refresh, itemType) {
    console.log('calling queryPurchaseHistoryAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    if (refresh && !itemType) {
        throw new Error('Must define item type if querying updated history');
    }
    return await ExpoInAppPurchases.queryPurchaseHistoryAsync(refresh ? itemType : null);
}
export async function purchaseItemAsync(itemId, oldItem) {
    console.log('calling purchaseItemAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    return await ExpoInAppPurchases.purchaseItemAsync(itemId, oldItem);
}
export async function acknowledgePurchaseAsync(purchaseToken, consumeItem) {
    if (Platform.OS !== 'android')
        return;
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
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return billingResponseCodes.SERVICE_DISCONNECTED;
    }
    if (Platform.OS !== 'android') {
        return billingResponseCodes.OK;
    }
    return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}
export async function disconnectAsync() {
    console.log('calling disconnectAsync from TS');
    if (!connected) {
        throw new ConnectionError('Already disconnected from App Store');
    }
    connected = false;
    return await ExpoInAppPurchases.disconnectAsync();
}
class ConnectionError extends CodedError {
    constructor(message) {
        super('ERR_Connection', message);
    }
}
//# sourceMappingURL=InAppPurchases.js.map