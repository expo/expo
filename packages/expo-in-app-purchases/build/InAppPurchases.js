import { CodedError, EventEmitter } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExpoInAppPurchases from './ExpoInAppPurchases';
import { IAPErrorCode, IAPItemType, IAPResponseCode, InAppPurchaseState, } from './InAppPurchases.types';
export { InAppPurchaseState, IAPResponseCode, IAPErrorCode, IAPItemType, };
const errors = {
    ALREADY_CONNECTED: 'Already connected to App Store',
    ALREADY_DISCONNECTED: 'Already disconnected from App Store',
    NOT_CONNECTED: 'Must be connected to App Store',
};
const PURCHASES_UPDATED_EVENT = 'Expo.purchasesUpdated';
const eventEmitter = new EventEmitter(ExpoInAppPurchases);
let connected = false;
let purchaseUpdatedSubscription;
export async function connectAsync() {
    if (connected) {
        throw new ConnectionError(errors.ALREADY_CONNECTED);
    }
    await ExpoInAppPurchases.connectAsync();
    connected = true;
}
export async function getProductsAsync(itemList) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    return await ExpoInAppPurchases.getProductsAsync(itemList);
}
export async function getPurchaseHistoryAsync(options = { useGooglePlayCache: true }) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    if (Platform.OS === 'android') {
        return await ExpoInAppPurchases.getPurchaseHistoryAsync(options);
    }
    else {
        return await ExpoInAppPurchases.getPurchaseHistoryAsync();
    }
}
export async function purchaseItemAsync(itemId, oldPurchaseToken) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    await ExpoInAppPurchases.purchaseItemAsync(itemId, oldPurchaseToken);
}
export function setPurchaseListener(callback) {
    if (purchaseUpdatedSubscription) {
        purchaseUpdatedSubscription.remove();
    }
    purchaseUpdatedSubscription = eventEmitter.addListener(PURCHASES_UPDATED_EVENT, result => {
        callback(result);
    });
}
export async function finishTransactionAsync(purchase, consumeItem) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    if (purchase.acknowledged)
        return;
    if (Platform.OS === 'android') {
        await ExpoInAppPurchases.finishTransactionAsync(purchase.purchaseToken, consumeItem);
    }
    else {
        await ExpoInAppPurchases.finishTransactionAsync(purchase.orderId);
    }
}
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return IAPResponseCode.ERROR;
    }
    if (!ExpoInAppPurchases.getBillingResponseCodeAsync) {
        return IAPResponseCode.OK;
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