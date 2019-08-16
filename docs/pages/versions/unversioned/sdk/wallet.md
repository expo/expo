---
title: Wallet
---

Provides interactions for applications to add passes to Apple Wallet.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-wallet).

## API

```js
import * as Wallet from 'expo-wallet';
```

### Methods

- [`Wallet.canAddPassesAsync()`](#walletcanaddpassesasync)
- [`Wallet.addPassFromUrlAsync(url)`](#walletaddpassfromurlasyncurl)
- [`Wallet.addPassFromFilePathAsync(filePath)`](#walletaddpassfromfilepathasyncfilepath)

### Event Subscriptions

- [`Wallet.addPassViewDidFinishListener(callback)`](#walletaddpassviewdidfinishlistenercallback)

### Errors

- [Error Codes](#error-codes)

## Methods

### `Wallet.canAddPassesAsync()`

**iOS only.** Tells whether current device supports adding passes to apple wallet

#### Returns

A `Promise` that resolves to a `boolean` value of whether the device supports adding passes to apple wallet.

**Examples**

```js
await Wallet.canAddPassesAsync();
// true or false
```

### `Wallet.addPassFromUrlAsync(url)`

**iOS only.** Adds passes to Apple wallet from given url and present the add passes view controller modally with animation to prompt the user to add it to Apple Wallet. If the pass is already added to Apple Wallet, this method returns `true` and does not open preview of the pass.

#### Arguments

- **url (_string_)** -- valid url where it directs to a [`PKPass`](https://developer.apple.com/documentation/passkit/pkpass?language=objc) file.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the pass is sccessfully added to Apple Wallet.

**Examples**

```js
await Wallet.addPassFromUrlAsync('passUrl');
// true or false
```

### `Wallet.addPassFromFilePathAsync(filePath)`

**iOS only.** Adds passes to Apple wallet from given file path and present the add passes view controller modally with animation to prompt the user to add it to Apple Wallet. If the pass is already added to Apple Wallet, this method returns `true` and does not open preview of the pass.

#### Arguments

- **filePath (_string_)** -- valid file path where it directs to a [`PKPass`](https://developer.apple.com/documentation/passkit/pkpass?language=objc) file.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the pass is sccessfully added to Apple Wallet.

**Examples**

```js
await Wallet.addPassFromUrlAsync('filePath');
// true or false
```

## Event Subscriptions

### `Wallet.addPassViewDidFinishListener(callback)`

**iOS only.** Subscribe to the event after the add-passes view controller has finished.

On web, the event never fires.

#### Arguments

- **callback (_function_)** A callback that is invoked after the add-passes view controller has finished.

#### Returns

- An `EventSubscription` object on which you can call `remove()` to unsubscribe from the listener.

## Error Codes

| Code                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| ERR_WALLET_INVALID_PASS | Given file path or url does not contain valid pass data. |
| ERR_WALLET_VIEW_PASS_FAILED | Failed to present PKAddPassesViewController. |
