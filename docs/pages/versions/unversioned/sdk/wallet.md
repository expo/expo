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

### Components

- [`<Wallet.AddPassButton />`](#walletaddpassbutton)

### Methods

- [`Wallet.canAddPassesAsync()`](#walletcanaddpassesasync)
- [`Wallet.addPassFromUrlAsync(url)`](#walletaddpassfromurlasyncurl)

### Event Subscriptions

- [`Wallet.addPassViewDidFinishListener(callback)`](#walletaddpassviewdidfinishlistenercallback)

### Errors

- [Error Codes](#error-codes)

## Components

### `Wallet.AddPassButton`

**iOS only.** An Apple-provided responsive button ([`PKAddPassButton`](https://developer.apple.com/documentation/passkit/pkaddpassbutton)) that displays "Add to Apple Wallet".

For web, you could download the [Add to Apple Wallet badge](https://developer.apple.com/wallet/#related-content) from Apple Developer website.

#### Properties

- **type (_string_)** -- The button’s style, which could either be [`'black'`](https://developer.apple.com/documentation/passkit/pkaddpassbuttonstyle/pkaddpassbuttonstyleblack) (default) or [`'blackOutline'`](https://developer.apple.com/documentation/passkit/pkaddpassbuttonstyle/pkaddpassbuttonstyleblackoutline).
- You could also use any other properties of a [`TouchableHighlight`](https://facebook.github.io/react-native/docs/touchablehighlight#props).

## Methods

### `Wallet.canAddPassesAsync()`

Tells whether the current device supports adding passes to Apple Wallet.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the device supports adding passes to Apple Wallet.

**Examples**

```js
await Wallet.canAddPassesAsync();
// `true` or `false`
```

### `Wallet.addPassFromUrlAsync(url)`

**iOS and web only.** Presents the [Passes View Controller](https://developer.apple.com/documentation/passkit/pkaddpassesviewcontroller) modally with animation to prompt the user to add the pass given by `url` to Apple Wallet. If the pass was already added to Apple Wallet, this method returns `true` and does not open preview of the pass.

Note that if you want to use a `.pkpass` file from a local file path in your application, you can use `Asset` from [`expo-asset`](../../sdk/asset/) to get the remote URI. See examples at the bottom. Also, remember to add `"pkpass"` into your `assetExts` in `metro.config.js` in root directory so that Metro can resolve the file.

#### Arguments

- **url (_string_)** -- valid URL where it directs to a [`PKPass`](https://developer.apple.com/documentation/passkit/pkpass) file.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the pass is successfully added to Apple Wallet.

**Examples**

```js
await Wallet.addPassFromUrlAsync('https://example.com/your-pass.pkpass');
// `true` or `false`
```

## Event Subscriptions

### `Wallet.addPassViewDidFinishListener(callback)`

**iOS only.** Subscribes to the event after the Passes View Controller is dismissed.

For web, the event never fires.

#### Arguments

- **callback (_function_)** A callback that is invoked after the Passes View Controller is dismissed.

#### Returns

- An `EventSubscription` object on which you can call `remove()` to unsubscribe from the listener.

## Error Codes

| Code                        | Description                                 |
| --------------------------- | ------------------------------------------- |
| ERR_WALLET_INVALID_PASS     | Given URL does not contain valid pass data. |
| ERR_WALLET_VIEW_PASS_FAILED | Failed to present Passes View Controller.   |

**Examples (use `Asset` to add a local `.pkpass` file)**

```js
import React from 'react';
import { StyleSheet, View, Button } from 'react-native';
import * as Wallet from 'expo-wallet';
import { Asset } from 'expo-asset';

export default class App extends React.Component {
  componentDidMount() {
    this._subscribe();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _subscribe = () => {
    this._subscription = Wallet.addPassViewDidFinishListener(() => {
      console.log('Passes View Controller dismissed');
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  _onPressWallet = () => {
    Wallet.canAddPassesAsync().then(canAdd => {
      console.log('Can add pass', canAdd);
      let filePath = Asset.fromModule(require('./your/local/file/path/to/pkpass')).uri;
      Wallet.addPassFromUrlAsync(filePath).then(open => {
        console.log('Pass added', open);
      });
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <Wallet.AddPassButton
          type={'black'}
          style={{ height: 60, width: 200 }}
          onPress={() => _onPressWallet()}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```
