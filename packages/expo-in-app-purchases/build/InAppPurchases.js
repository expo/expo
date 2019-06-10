import { Platform } from 'react-native';
import { CodedError } from '@unimodules/core';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { ResponseCode, ErrorCode } from './InAppPurchases.types';
const errors = {
    ALREADY_CONNECTED: 'Already connected to App Store',
    ALREADY_DISCONNECTED: 'Already disconnected from App Store',
    NOT_CONNECTED: 'Must be connected to App Store',
};
let connected = false;
export { ResponseCode, ErrorCode, };
export async function connectAsync() {
    if (connected) {
        throw new ConnectionError(errors.ALREADY_CONNECTED);
    }
    const result = await ExpoInAppPurchases.connectAsync();
    connected = true;
    return result;
}
export async function getProductsAsync(itemList) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    return await ExpoInAppPurchases.getProductsAsync(itemList);
}
export async function getPurchaseHistoryAsync(refresh) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    return await ExpoInAppPurchases.getPurchaseHistoryAsync(refresh);
}
export async function purchaseItemAsync(itemId, oldItem) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    // Replacing old item is only supported on Android
    const args = Platform.OS === 'android' ? [itemId, oldItem] : [itemId];
    return await ExpoInAppPurchases.purchaseItemAsync(...args);
}
export async function acknowledgePurchaseAsync(purchaseToken, consumeItem) {
    // No-op if not on Android since this is not applicable
    if (!ExpoInAppPurchases.acknowledgePurchaseAsync)
        return;
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    if (consumeItem) {
        return await ExpoInAppPurchases.consumeAsync(purchaseToken);
    }
    return await ExpoInAppPurchases.acknowledgePurchaseAsync(purchaseToken);
}
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return ResponseCode.ERROR;
    }
    if (!ExpoInAppPurchases.getBillingResponseCodeAsync) {
        return ResponseCode.OK;
    }
    return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}
export async function disconnectAsync() {
    if (!connected) {
        throw new ConnectionError(errors.ALREADY_DISCONNECTED);
    }
    await ExpoInAppPurchases.disconnectAsync();
    connected = false;
}
class ConnectionError extends CodedError {
    constructor(message) {
        super('ERR_IN_APP_PURCHASES_CONNECTION', message);
    }
}
//# sourceMappingURL=InAppPurchases.js.map