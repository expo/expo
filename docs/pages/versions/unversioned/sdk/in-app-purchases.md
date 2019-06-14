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

Note that on iOS, the results array will only contain one item: the one that was just purchased. On Android, it will return both finished and unfinished purchases, hence the array return type. This is because the Google Play Billing API detects purchase updates but doesn't differentiate which item was purchased, therefore there's no good way to tell but in general it will be whichever purchase has `acknowledged` set to `false`, so those are the ones that you have to handle. Consumed items will not be returned, however, so if you consume an item that record will be gone and no longer appear in the results array when a new purchase is made.

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

- **responseCode (_ResponseCode_)** -- A number indicating the last billing response code.

### `InAppPurchases.disconnectAsync()`

Removes listeners, both internally and the one set in `setPurchaseListener`, and cleans up memory. Call this when you are done using the In-App Purchases API in your app.

No other methods can be used until the next time you call `connectAsync`.

## Object Types

### QueryResponse

The response type for queries and purchases.

| Field name            | Type      | Platforms | Description                                                                   | Possible values                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| responseCode                 | _ResponseCode_  | both      | The response code from a query or purchase.                                  | `ResponseCode.OK`, `ResponseCode.USER_CANCELED`, `ResponseCode.ERROR`, `ResponseCode.DEFERRED` (iOS only)                                                                                                                                                                                                                                                                                                                                                                   |
| results   | _Purchase[] or ItemDetails[]_ | Android      | The array containing the `Purchase` or `ItemDetails` objects requested depending on the method.           |                                                                                                                                                                                                                                                                                                                                                                    |
| errorCode                    | _ErrorCode_  | both      | `ErrorCode` that provides more detail on why an error occurred. Null unless responseCode is `ResponseCode.ERROR`                       |  `ErrorCode.PAYMENT_INVALID`, `ErrorCode.ITEM_ALREADY_OWNED`, `ErrorCode.UNKNOWN`                                                                                                                                                                                                                                                                                                                                                                 |

### Purchase

A record of a purchase made by the user.

| Field name            | Type      | Platforms | Description                                                                   | Possible values                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| productId                 | _string_  | both      | The product ID representing an item inputted in Google Play Console and App Store Connect.                                                  |                                                                                                                                                                                                                                                                                                                                                                    |
| acknowledged                    | _boolean_  | both      | Boolean indicating whether this item has been "acknowledged" via `finishTransactionAsync`                       |                                                                                                                                                                                                                                                                                                                                                                    |
| purchaseState            | _number_  | both       | The state of the purchase              |                                                                                                                                                                                                                                                                                                       |
| purchaseTime                | _number_  | both      | The time the product was purchased, in milliseconds since the epoch (Jan 1, 1970)                  |                                                                                                                                                                                                                                                                                                                                                                    |
| orderId                 | _string_  | both      | A string that uniquely identifies a successful payment transaction.                                  |                                                                                                                                                                                                                                                                                                                                                                    |
| packageName   | _string_ | Android      | The application package from which the purchase originated           | `com.example.myapp`                                                                                                                                                                                                                                                                                                                                                                   |
| purchaseToken                  | _string_  | Android       | A token that uniquely identifies a purchase for a given item and user pair.                                        |                                                                                                                                                                                            |
| originalOrderId             | _string_ | iOS   | Represents the original order ID for restored purchases       |                                                                                                                                                                                                                                                                                                                                                                    |
| originalPurchaseTime                  | _string_  | iOS   | Represents the original purchase time for restored purchases                                          |                                                                                                                                                                                                                                                                                                                                                                    |
| transactionReceipt          | _string_  | iOS   | The App Store receipt found in the main bundle encoded as a Base 64 String                                  |                                                                                                                                                        
### ItemDetails

Details about the purchasable item that you inputted in App Store Connect and Google Play Console.

| Field name            | Type      | Platforms | Description                                                                   | Possible values                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| productId                 | _string_  | both      | The product ID representing an item inputted in Google Play Console and App Store Connect.                                  |                                                                                                                                                                                                                                                                                                                                                                    |
| title   | _string_ | Android      | The title of the purchasable item. This should be displayed to the user and may be different from the productId.           |                                                                                                                                                                                                                                                                                                                                                                    |
| description                    | _string_  | both      | User facing description about the item.                       |                                                                                                                                                                                                                                                                                                                                                                    |
| price                 | _string_  | both      | The price formatted with the local currency symbol. Use this to display the price, not to make calculations.                                                  | `$1.99`                                                                                                                                                                                                                                                                                                                                                                  |
| priceAmountMicros            | _number_  | both       | The price in micro-units, where 1,000,000 micro-units equal one unit of the currency. Use this for calculations.              | `1990000`                                                                                                                                                                                                                                                                                                      |
| priceCurrencyCode                | _string_  | both      | The local currency code from the ISO 4217 code list               | `USD`, `CAN`, `RUB`                                                                                                                                                                                                                                                                                                                                                                   |
| type                  | _string_  | both       | The type of the purchase. Note that this is not very accurate on iOS as this data is only available on iOS 11.2 and higher and non-renewable subscriptions always return `inapp`                                      |  `inapp`, `subs`                                                                                                                                                                                          |
| subscriptionPeriod             | _string_ | both   | The length of a subscription period, specified in ISO 8601 format. On iOS, `inapp` purchases and non-renewable subscriptions return `P0D`. On Android, `inapp` purchases return an empty string.      | `P0D`, `P6W`, `P3M`, `P6M`, `P1Y` |

## Enum Types

### `InAppPurchases.ResponseCode`

- **`ResponseCode.OK`** - Response returned successfully.
- **`ResponseCode.USER_CANCELED`** - User canceled the purchase.
- **`ResponseCode.ERROR`** - An error occurred. Check the `errorCode` for additional details.
- **`ResponseCode.DEFERRED`** - Purchase was deferred. (iOS only)

### `InAppPurchases.ErrorCode`

Abstracts over the Android [Billing Response Codes](https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode) and iOS [SKErrorCodes](https://developer.apple.com/documentation/storekit/skerrorcode?language=objc)

- **`ErrorCode.UNKNOWN`** -  An unknown or unexpected error occurred. See`SKErrorUnknown` on iOS, `ERROR` on Android.
- **`ErrorCode.PAYMENT_INVALID`** - The feature is not allowed on the current device, or the user is not authorized to make payments. See `SKErrorClientInvalid`, `SKErrorPaymentInvalid`, and `SKErrorPaymentNotAllowed` on iOS, `FEATURE_NOT_SUPPORTED` on Android.
- **`ErrorCode.SERVICE_DISCONNECTED`** - Play Store service is not connected now. See `SERVICE_DISCONNECTED` on Android.
- **`ErrorCode.SERVICE_UNAVAILABLE`** - Network connection is down. See `SERVICE_UNAVAILABLE` on Android.
- **`ErrorCode.SERVICE_TIMEOUT`** - The request has reached the maximum timeout before Google Play responds. See `SERVICE_TIMEOUT` on Android.
- **`ErrorCode.BILLING_UNAVAILABLE`** - Billing API version is not supported for the type requested. See `BILLING_UNAVAILABLE` on Android.
- **`ErrorCode.ITEM_UNAVAILABLE`** - Requested product is not available for purchase. See `SKErrorStoreProductNotAvailable` on iOS, `ITEM_UNAVAILABLE` on Android.
- **`ErrorCode.DEVELOPER_ERROR`** - Invalid arguments provided to the API. This error can also indicate that the application was not correctly signed or properly set up for In-app Billing in Google Play. See `DEVELOPER_ERROR` on Android.
- **`ErrorCode.ITEM_ALREADY_OWNED`** - Failure to purchase since item is already owned. See `ITEM_ALREADY_OWNED` on Android.
- **`ErrorCode.ITEM_NOT_OWNED`** - Failure to consume since item is not owned. See `ITEM_NOT_OWNED` on Android.
- **`ErrorCode.CLOUD_SERVICE`** - Apple Cloud Service connection failed or invalid permissions. See `SKErrorCloudServicePermissionDenied`, `SKErrorCloudServiceNetworkConnectionFailed`, and `SKErrorCloudServiceRevoked` on iOS.
- **`ErrorCode.PRIVACY_UNACKNOWLEDGED`** - The user has not yet acknowledged Apple’s privacy policy for Apple Music. See `SKErrorPrivacyAcknowledgementRequired` on iOS.
- **`ErrorCode.UNAUTHORIZED_REQUEST`** - The app is attempting to use a property for which it does not have the required entitlement. See `SKErrorUnauthorizedRequestData` on iOS.
- **`ErrorCode.INVALID_IDENTIFIER`** - The offer identifier or price specified in App Store Connect is no longer valid. See `SKErrorInvalidSignature`, `SKErrorInvalidOfferPrice`, `SKErrorInvalidOfferIdentifier` on iOS.
- **`ErrorCode.MISSING_PARAMS`** - Parameters are missing in a payment discount. See `SKErrorMissingOfferParams` on iOS.