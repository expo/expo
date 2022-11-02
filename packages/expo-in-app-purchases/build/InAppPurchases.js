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
// @needsAudit
/**
 * Connects to the app store and performs all of the necessary initialization to prepare the module
 * to accept payments. This method must be called before anything else, otherwise an error will be
 * thrown.
 * @return Returns a Promise that fulfills when connection is established.
 */
export async function connectAsync() {
    if (connected) {
        throw new ConnectionError(errors.ALREADY_CONNECTED);
    }
    await ExpoInAppPurchases.connectAsync();
    connected = true;
}
// @needsAudit
/**
 * Retrieves the product details (price, description, title, etc) for each item that you inputted in
 * the Google Play Console and App Store Connect. These products are associated with your app's
 * specific Application/Bundle ID and cannot be retrieved from other apps. This queries both in-app
 * products and subscriptions so there's no need to pass those in separately.
 *
 * You must retrieve an item's details before you attempt to purchase it via `purchaseItemAsync`.
 * This is a prerequisite to buying a product even if you have the item details bundled in your app
 * or on your own servers.
 *
 * If any of the product IDs passed in are invalid and don't exist, you will not receive an
 * `IAPItemDetails` object corresponding to that ID. For example, if you pass in four product IDs in
 * but one of them has a typo, you will only get three response objects back.
 *
 * @param itemList The list of product IDs whose details you want to query from the app store.
 * @return Returns a Promise that resolves with an `IAPQueryResponse` containing `IAPItemDetails`
 * objects in the `results` array.
 *
 * @example
 * ```ts
 * // These product IDs must match the item entries you created in the App Store Connect and Google Play Console.
 * // If you want to add more or edit their attributes you can do so there.
 *
 * const items = Platform.select({
 *   ios: [
 *     'dev.products.gas',
 *     'dev.products.premium',
 *     'dev.products.gold_monthly',
 *     'dev.products.gold_yearly',
 *   ],
 *   android: ['gas', 'premium', 'gold_monthly', 'gold_yearly'],
 * });
 *
 *  // Retrieve product details
 * const { responseCode, results } = await getProductsAsync(items);
 * if (responseCode === IAPResponseCode.OK) {
 *   this.setState({ items: results });
 * }
 * ```
 */
export async function getProductsAsync(itemList) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    return await ExpoInAppPurchases.getProductsAsync(itemList);
}
// @needsAudit
/**
 * Retrieves the user's purchase history.
 *
 * Please note that on iOS, StoreKit actually creates a new transaction object every time you
 * restore completed transactions, therefore the `purchaseTime` and `orderId` may be inaccurate if
 * it's a restored purchase. If you need the original transaction's information you can use
 * `originalPurchaseTime` and `originalOrderId`, but those will be 0 and an empty string
 * respectively if it is the original transaction.
 *
 * You should not call this method on launch because restoring purchases on iOS prompts for the
 * user’s App Store credentials, which could interrupt the flow of your app.
 *
 * @param options An optional `PurchaseHistoryOptions` object.
 * @return Returns a `Promise` that fulfills with an `IAPQueryResponse` that contains an array of
 * `InAppPurchase` objects.
 */
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
// @needsAudit
/**
 * Initiates the purchase flow to buy the item associated with this `productId`. This will display a
 * prompt to the user that will allow them to either buy the item or cancel the purchase. When the
 * purchase completes, the result must be handled in the callback that you passed in to
 * [`setPurchaseListener`](#setpurchaselistener).
 *
 * Remember, you have to query an item's details via `getProductsAsync` and set the purchase
 * listener before you attempt to buy an item.
 *
 * [Apple](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/subscriptions_and_offers)
 * and [Google](https://developer.android.com/google/play/billing/subscriptions) both have
 * their own workflows for dealing with subscriptions. In general, you can deal with them in the
 * same way you do one-time purchases but there are caveats including if a user decides to cancel
 * before the expiration date. To check the status of a subscription, you can use the [Google Play
 * Developer](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get)
 * API on Android and the [Status Update
 * Notifications](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/subscriptions_and_offers/enabling_app_store_server_notifications)
 * service on iOS.
 *
 * @param itemId The product ID of the item you want to buy.
 * @param details __Android Only.__ Details for billing flow.
 * @return Returns a `Promise` that resolves when the purchase is done processing. To get the actual
 * result of the purchase, you must handle purchase events inside the `setPurchaseListener`
 * callback.
 */
export async function purchaseItemAsync(itemId, details) {
    if (!connected) {
        throw new ConnectionError(errors.NOT_CONNECTED);
    }
    await ExpoInAppPurchases.purchaseItemAsync(itemId, details);
}
// @needsAudit
/**
 * Sets a callback that handles incoming purchases. This must be done before any calls to
 * `purchaseItemAsync` are made, otherwise those transactions will be lost. You should **set the
 * purchase listener globally**, and not inside a specific screen, to ensure that you receive
 * incomplete transactions, subscriptions, and deferred transactions.
 *
 * Purchases can either be instantiated by the user (via `purchaseItemAsync`) or they can come from
 * subscription renewals or unfinished transactions on iOS (e.g. if your app exits before
 * `finishTransactionAsync` was called).
 *
 * Note that on iOS, the results array will only contain one item: the one that was just
 * purchased. On Android, it will return both finished and unfinished purchases, hence the array
 * return type. This is because the Google Play Billing API detects purchase updates but doesn't
 * differentiate which item was just purchased, therefore there's no good way to tell but in general
 * it will be whichever purchase has `acknowledged` set to `false`, so those are the ones that you
 * have to handle in the response. Consumed items will not be returned however, so if you consume an
 * item that record will be gone and no longer appear in the results array when a new purchase is
 * made.
 *
 * @example
 * ```ts
 * // Set purchase listener
 *  setPurchaseListener(({ responseCode, results, errorCode }) => {
 *   // Purchase was successful
 *   if (responseCode === IAPResponseCode.OK) {
 *     results.forEach(purchase => {
 *       if (!purchase.acknowledged) {
 *         console.log(`Successfully purchased ${purchase.productId}`);
 *         // Process transaction here and unlock content...
 *
 *         // Then when you're done
 *         finishTransactionAsync(purchase, true);
 *       }
 *     });
 *   } else if (responseCode === IAPResponseCode.USER_CANCELED) {
 *     console.log('User canceled the transaction');
 *   } else if (responseCode === IAPResponseCode.DEFERRED) {
 *     console.log('User does not have permissions to buy but requested parental approval (iOS only)');
 *   } else {
 *     console.warn(`Something went wrong with the purchase. Received errorCode ${errorCode}`);
 *   }
 * });
 * ```
 * @param callback The callback function you want to run when there is an update to the purchases.
 */
export function setPurchaseListener(callback) {
    if (purchaseUpdatedSubscription) {
        purchaseUpdatedSubscription.remove();
    }
    purchaseUpdatedSubscription = eventEmitter.addListener(PURCHASES_UPDATED_EVENT, (result) => {
        callback(result);
    });
}
// @needsAudit
/**
 * Marks a transaction as completed. This _must_ be called on successful purchases only after you
 * have verified the transaction and unlocked the functionality purchased by the user.
 *
 * On Android, this will either "acknowledge" or "consume" the purchase depending on the value of
 * `consumeItem`. Acknowledging indicates that this is a one time purchase (e.g. premium upgrade),
 * whereas consuming a purchase allows it to be bought more than once. You cannot buy an item again
 * until it's consumed. Both consuming and acknowledging let Google know that you are done
 * processing the transaction. If you do not acknowledge or consume a purchase within three days,
 * the user automatically receives a refund, and Google Play revokes the purchase.
 *
 * On iOS, this will [mark the transaction as
 * finished](https://developer.apple.com/documentation/storekit/skpaymentqueue/1506003-finishtransaction)
 * and prevent it from reappearing in the purchase listener callback. It will also let the user know
 * their purchase was successful.
 *
 * `consumeItem` is ignored on iOS because you must specify whether an item is a consumable or
 * non-consumable in its product entry in App Store Connect, whereas on Android you indicate an item
 * is consumable at runtime.
 *
 * > Make sure that you verify each purchase to prevent faulty transactions and protect against
 * > fraud _before_ you call `finishTransactionAsync`. On iOS, you can validate the purchase's
 * > `transactionReceipt` with the App Store as described
 * > [here](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/validating_receipts_with_the_app_store?language=objc).
 * > On Android, you can verify your purchase using the Google Play Developer API as described
 * > [here](https://developer.android.com/google/play/billing/security#validating-purchase).
 *
 * @example
 * ```ts
 * if (!purchase.acknowledged) {
 *   await finishTransactionAsync(purchase, false); // or true for consumables
 * }
 * ```
 * @param purchase The purchase you want to mark as completed.
 * @param consumeItem __Android Only.__ A boolean indicating whether or not the item is a
 * consumable.
 */
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
// @needsAudit
/**
 * Returns the last response code. This is more descriptive on Android since there is native support
 * for retrieving the billing response code.
 *
 * On Android, this will return `IAPResponseCode.ERROR` if you are not connected or one of the
 * billing response codes found
 * [here](https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode)
 * if you are.
 *
 * On iOS, this will return `IAPResponseCode.OK` if you are connected or `IAPResponseCode.ERROR` if
 * you are not. Therefore, it's a good way to test whether or not you are connected and it's safe to
 * use the other methods.
 *
 * @return Returns a Promise that fulfils with an number representing the `IAPResponseCode`.
 *
 * @example
 * ```ts
 * const responseCode = await getBillingResponseCodeAsync();
 *  if (responseCode !== IAPResponseCode.OK) {
 *   // Either we're not connected or the last response returned an error (Android)
 * }
 * ```
 */
export async function getBillingResponseCodeAsync() {
    if (!connected) {
        return IAPResponseCode.ERROR;
    }
    if (!ExpoInAppPurchases.getBillingResponseCodeAsync) {
        return IAPResponseCode.OK;
    }
    return await ExpoInAppPurchases.getBillingResponseCodeAsync();
}
// @needsAudit
/**
 * Disconnects from the app store and cleans up memory internally. Call this when you are done using
 * the In-App Purchases API in your app.
 *
 * No other methods can be used until the next time you call `connectAsync`.
 *
 *@return Returns a Promise that fulfils when disconnecting process is finished.
 */
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