---
title: InAppPurchases
---

An API to accept payments for in-app products. Internally relies on the [Google Play Billing](https://developer.android.com/google/play/billing/billing_library_overview) library on Android and [Storekit](https://developer.apple.com/documentation/storekit?language=objc) framework on iOS.

## Installation

This module is currently only available in the [bare](../../introduction/managed-vs-bare/#bare-workflow) workflow.

Note that in-app purchases require physical devices to work and therefore cannot be tested on simulators.

## API

```js
import * as InAppPurchases from 'expo-in-app-purchases';
```

### `InAppPurchases.connectAsync()`

Connects to the app store and performs all of the necessary initialization to prepare the module to accept payments.

This method *must* be called before anything else, otherwise an error will be thrown.

#### Returns

A `Promise` that is resolved with a `QueryResponse` that contains an array of `Purchase` objects. This represents the user's previous purchase history and returns the same result as `getPurchaseHistoryAsync()`.

### `InAppPurchases.getProductsAsync(itemList: string[])`

Retrieves the product details (price, description, title, etc) for each item that you inputted in the Google Play Console and App Store Connect. This queries both in-app products and subscriptions so there's no need to pass those in separately.

Note that you must retrieve an item's details before you attempt to purchase it via `purchaseItemAsync` so this is a prerequisite to buying a product even if you have the item details bundled in your app or on your own servers.

If any of the product IDs passed in are invalid and don't exist, you will not receive an `ItemDetails` object corresponding to that ID. For example, if you pass in four product IDs in but one of them has a typo, you will only get three response objects back.

#### Arguments

- **itemList (_string[]_)** -- The list of product IDs whose details you want to query from the app store.

#### Returns

A `Promise` that is resolved with a `QueryResponse` containing `ItemDetails` objects in the results array.

### `InAppPurchases.setPurchaseListener(callback: (result: QueryResponse) => void)`

Sets a callback that handles incoming purchases. This must be set before any calls to `purchaseItemAsync` are made. Otherwise, those transactions will be lost.

Purchases can either be instantiated by the user (via `purchaseItemAsync`) or they can come from subscription renewals or unfinished transactions on iOS (e.g. if your app exits before `finishTransactionAsync` was called).

Note that on iOS, the results array will only contain one item: the one that was just purchased. On Android, it will return both finished and unfinished purchases, hence the array return type. This is because the Google Play Billing API detects purchase updates but doesn't differentiate which item was purchased, therefore there's no good way to tell but in general it will be whichever purchase has `acknowledged` set to `false`. Consumed items will not be returned, however, so if you consume an item that record will be gone and no longer appear in the results array when a new purchase is made.

#### Arguments

- **callback (_(result: QueryResponse) => void_)** -- The callback function you want to run when there is an update to the purchases.

### `InAppPurchases.getPurchaseHistoryAsync(refresh?: boolean)`

Retrieves the user's previous purchase history.

On Android, if refresh is set to `true` it will make a network request and return up to one entry per item even if that purchase is expired, canceled, or consumed. Use this if you want to sync purchases across devices or see purchases that are expired or consumed. If refresh is `false` it relies on the Play Store cache and returns the same result as `connectAsync`. An important caveat is that the return type when refresh is `true` is actually a subset of when it's `false`. This is because Android returns a `PurchaseHistoryRecord` which only contains the purchase time, purchase token, and product ID, rather than all of the attributes found in the `Purchase` type.

On iOS, the refresh boolean is ignored and it returns the purchase history in the same way that `connectAsync` does. An important thing to note is that on iOS, Storekit actually creates a new transaction object every time you restore completed transactions, therefore the `purchaseTime` and `orderId` may be inaccurate if it's a restored purchase. If you need the original transaction's information you can use `originalPurchaseTime` and `originalOrderId`, but those will be 0 and an empty string respectively if it is the original transaction.

#### Arguments

- **refresh (_boolean_)** -- A boolean that indicates whether or not you want to make a network request to sync expired/consumed purchases and those on other devices (Android only)

#### Returns

A `Promise` that is resolved with a `QueryResponse` that contains an array of `Purchase` objects.

### `InAppPurchases.purchaseItemAsync(productId: string, oldItem?: string)`

Initiates the purchase flow to buy the item associated with this productId. This function is void and the result must be handled in the callback that you passed in to `setPurchaseListener`. This will display a prompt to the user which will allow them to either buy the item or cancel the purchase.

#### Arguments

- **productId (_string_)** -- The product ID of the item you want to buy.

- **oldItem (_string_)** -- The product ID of the item you want to replace with this new purchase, typically a subscription such as when a user upgrades from monthly to yearly (Android only).

### `InAppPurchases.finishTransactionAsync(purchase: Purchase, consumeItem: boolean)`

Marks a transaction as completed. This must be called on successful purchases only after you have successfully processed the transaction and unlocked the functionality purchased by the user.

On Android, this will either "acknowledge" or "consume" the purchase depending on the value of `consumeItem`. Consuming a purchase allows it to be bought more than once. You cannot buy an item again until it's consumed. Both consuming and acknowledging let Google know that you are done processing the transaction. Acknowledging indicates that this is a one time purchase (e.g. premium upgrade), rather than a consumable. If you do not acknowledge or consume a purchase within three days, the user automatically receives a refund, and Google Play revokes the purchase.

On iOS, this will mark the transaction as finished and prevent it from reappearing in the purchase listener callback. It will also let the user know their purchase was successful.

#### Arguments

- **purchase (_Purchase_)** -- The purchase you want to mark as completed.

- **consumeItem (_boolean_)** -- A boolean indicating whether or not the item is a consumable (Android only)

### `InAppPurchases.getBillingResponseCodeAsync()`

Returns the last response code. This is more descriptive on Android since there is native support for retrieving the billing response code.

On Android, this will return `ResponseCode.ERROR` if you are not connected or one of the billing response codes found [here](https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode) if you are.

On iOS, this will return `ResponseCode.OK` if you are connected or `ResponseCode.ERROR` if you are not. Therefore, it's a good way to test whether or not you are connected and it's safe to use the other methods.

#### Returns

- **responseCode (_int_)** -- A number indicating the last billing response code.

### `InAppPurchases.disconnectAsync()`

Removes listeners, both internally and the one set in `setPurchaseListener`, and cleans up memory. Call this when you are done using the In-App Purchases API in your app.

No other methods can be used until the next time you call `connectAsync`.
