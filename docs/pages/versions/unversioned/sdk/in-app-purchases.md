---
title: In App Purchases
---

An API to accept payments for in app products. Internally uses the [Google Play Billing](https://developer.android.com/google/play/billing/billing_library_overview) library on Android and [Storekit](https://developer.apple.com/documentation/storekit?language=objc) framework on iOS.

## Installation

This API is currently only available in the [bare](../../introduction/managed-vs-bare/#bare-workflow) workflow.

## API

```js
import * as InAppPurchases from 'expo-in-app-purchases';
```

### `InAppPurchases.connectAsync()`

Initializes listeners and billing client.

### `InAppPurchases.getProductsAsync(itemList: string[])`

Gets product details.

#### Arguments

#### Returns

A `Promise` that is resolved with

### `InAppPurchases.getPurchaseHistoryAsync(refresh?: boolean)`

Description

#### Arguments

- **refresh (_boolean_)** -- A boolean

#### Example

```javascript

```

### `InAppPurchases.purchaseItemAsync(itemId: string, oldItem?: string)`

Initiates the purchase flow

#### Returns

A `Promise` that is resolved with

### `InAppPurchases.setPurchaseListener(callback: (result) => void)`

Description

#### Arguments

#### Returns

### `InAppPurchases.finishTransactionAsync(purchase: Purchase, consumeItem: boolean)`

Description

#### Arguments

#### Returns

### `InAppPurchases.getBillingResponseCodeAsync()`

Description

#### Returns

### `InAppPurchases.disconnectAsync()`

Description

#### Returns

