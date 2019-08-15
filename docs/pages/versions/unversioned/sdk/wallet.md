---
title: Wallet
---

Provides interactions for applications to add passes and cards to Apple Wallet.

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

**iOS only.** Adds passes to Apple wallet from given url and present the add passes view controller modally, with animation.

#### Arguments

- **url (_string_)** -- Valid url where it directs to a [`PKPass`](https://developer.apple.com/documentation/passkit/pkpass?language=objc) file.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the pass is sccessfully added to Apple Wallet.

**Examples**

```js
await Wallet.addPassFromUrlAsync('passUrl');
// true or false
```

### `Wallet.addPassFromFilePathAsync(filePath)`

**iOS only.** Adds passes to Apple wallet from given file path and present the add passes view controller modally, with animation.

#### Arguments

- **filePath (_string_)** -- Valid file path where it directs to a [`PKPass`](https://developer.apple.com/documentation/passkit/pkpass?language=objc) file.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the pass is sccessfully added to Apple Wallet.

**Examples**

```js
await Wallet.addPassFromUrlAsync('filePath');
// true or false
```

### `Wallet.canAddPaymentPassAsync()`

**iOS only.** Tells whether current device supports adding credit/debit cards to apple wallet.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the device supports adding cards to apple wallet.

**Examples**

```js
await Wallet.canAddPaymentPassAsync();
// true or false
```

## Error Codes

| Code                             | Description                                                     |
| -------------------------------- | --------------------------------------------------------------- |
