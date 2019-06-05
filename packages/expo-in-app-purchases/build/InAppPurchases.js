import { Platform } from 'react-native';
import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
const validTypes = {
    INAPP: 'inapp',
    SUBS: 'subs',
};
const { responseCodes, purchaseStates } = ExpoInAppPurchases;
export const constants = {
    responseCodes,
    purchaseStates,
    validTypes,
};
let connected = false;
export async function connectAsync() {
    console.log('calling connectToAppStoreAsync from TS');
    if (connected) {
        throw new ConnectionError('Already connected to App Store');
    }
    connected = true;
    return await ExpoInAppPurchases.connectAsync();
}
export async function getProductsAsync(itemList) {
    console.log('calling queryPurchasableItemsAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    if (Platform.OS === 'android') {
        // On Android you have to pass in the item type so we will combine the results of both inapp and subs
        const { responseCode, results } = await ExpoInAppPurchases.getProductsAsync(validTypes.INAPP, itemList);
        if (responseCode == responseCodes.OK) {
            const subs = await ExpoInAppPurchases.getProductsAsync(validTypes.SUBS, itemList);
            subs.results.forEach(result => {
                results.push(result);
            });
        }
        return { responseCode, results };
    }
    return await ExpoInAppPurchases.getProductsAsync(itemList);
}
export async function getPurchaseHistoryAsync(refresh) {
    console.log('calling queryPurchaseHistoryAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    if (refresh && Platform.OS === 'android') {
        const { responseCode, results } = await ExpoInAppPurchases.getPurchaseHistoryAsync(validTypes.INAPP);
        if (responseCode === responseCodes.OK) {
            const subs = await await ExpoInAppPurchases.getPurchaseHistoryAsync(validTypes.SUBS);
            subs.results.forEach(result => {
                results.push(result);
            });
        }
        return { responseCode, results };
    }
    return await ExpoInAppPurchases.getPurchaseHistoryAsync(null);
}
export async function purchaseItemAsync(itemId, oldItem) {
    console.log('calling purchaseItemAsync from TS');
    if (!connected) {
        throw new ConnectionError('Must be connected to App Store');
    }
    // Replacing old item is only supported on Android
    const args = Platform.OS === 'android' ? [itemId, oldItem] : [itemId];
    return await ExpoInAppPurchases.purchaseItemAsync(...args);
}
export async function acknowledgePurchaseAsync(purchaseToken, consumeItem) {
    // No-op if not on Android since this is not applicable
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
        return responseCodes.SERVICE_DISCONNECTED;
    }
    if (Platform.OS !== 'android') {
        return responseCodes.OK;
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