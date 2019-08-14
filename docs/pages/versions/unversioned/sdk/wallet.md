---
title: Wallet
---

Provides interactions between Apple Wallet and Google pay to add passes and cards with payments.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-wallet).

## API

```js
import * as Wallet from 'expo-wallet';
```

### Constants

- [`Wallet.ENVIRONMENT_TEST_KEY`](#walletenvironmenttestkey) (Android only)
- [`Wallet.ENVIRONMENT_PRODUCTION_KEY`](#walletenvironmentproductionkey) (Android only)

### Methods

- [`Wallet.getWalletLevelAsync()`](#WalletgetWalletlevelasync)
- [`Wallet.getWalletStateAsync()`](#WalletgetWalletstateasync)
- [`Wallet.isLowPowerModeEnabledAsync()`](#Walletislowpowermodeenabledasync)
- [`Wallet.getPowerStateAsync()`](#Walletgetpowerstateasync)

### Errors

- [Error Codes](#error-codes)

## Constants

### `Wallet.ENVIRONMENT_TEST_KEY`

Environment constant key to determine running the app in the test environment with relaxed application / merchant requirements.

### `Wallet.ENVIRONMENT_PRODUCTION_KEY`

Environment constant key to determine running the app in production environment with the most stringent application / merchant requirements.

## Methods

### `Wallet.canAddPassesAsync()`

Tells whether current device supports adding passes to apple wallet

#### Returns

A `Promise` that resolves to a `boolean` value of whether the device supports adding passes to apple wallet.

**Examples**

```js
await Wallet.canAddPassesAsync();
// true or false
```

### `Wallet.addPassFromUrlAsync(url)`

Adds passes to Apple wallet from given url and present the add passes view controller modally, with animation.

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

Adds passes to Apple wallet from given file path and present the add passes view controller modally, with animation.

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

Tells whether current device supports adding credit/debit cards to apple wallet.

#### Returns

A `Promise` that resolves to a `boolean` value of whether the device supports adding cards to apple wallet.

**Examples**

```js
await Wallet.canAddPaymentPassAsync();
// true or false
```

### `Wallet.setEnvironment(environmentKey)`

**Android only.** Sets development environment for using Google Pay. This must be called before all other `Wallet` functions regarding Google Pay.

#### Arguments

- **environmentKey (_string_)** -- The environment constant key for running in either production with the most stringent application / merchant requirements or test with relaxed application / merchant requirements. See available keys in [`Wallet.Constants`](#constants).

**Examples**

```js
Wallet.setEnvironment(Wallet.ENVIRONMENT_TEST_KEY);
```

### `Wallet.isReadyToPayAsync(allowedCardNetworks, allowedCardAuthMethod)`

**Android only.** Determines if the Google Pay API is supported by the current device and/or browser for your specified payment methods.

#### Arguments

- **allowedCardNetworks (_string_array_)** -- Defines the card networks accepted by your site. Accepted values are `["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]`.
- **allowedCardAuthMethod (_string_array_)** -- Card authentication methods supported by your site and your gateway. The Google Pay API may return cards on file on Google.com (`PAN_ONLY`) and/or a device token on an Android device authenticated with a 3-D Secure cryptogram (`CRYPTOGRAM_3DS`).

#### Returns

A `Promise` that resolves to a `boolean` value of whether the device supports Google Pay API with specified payment methods.

**Examples**

```js
const allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX'];
const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];
await Wallet.isReadyToPayAsync(allowedCardNetworks, allowedCardAuthMethods);
// true or false
```

### `Wallet.requestPaymentAsync(requestData)`

**Android only.** Request payment from Google Pay with given request payment configurations and display the Google Pay payment sheet. Note that it's better to call `Wallet.isReadyToPayAsync(allowedCardNetworks, allowedCardAuthMethod)` before call this method.

#### Arguments

`requestData` contains all payment data expected by your app and has the following fields:

- **merchantInfo (_object_)** -- Provides information about the merchant that requests payment data.

  - **merchantName (_string_)** -- Merchant name encoded as UTF-8. Merchant name is rendered in the payment sheet. In TEST environment, or if a merchant isn't recognized, a `“Pay Unverified Merchant”` message is displayed in the payment sheet.

- **allowedCardAuthMethod (_object_)** -- Adds the payment methods supported by your app including any configuration of additional data expected in the response.

  - **type (_string_)** -- `"CARD"` in default.
  - **parameters (_string_)** -- `allowedCardNetworks` and `allowedCardAuthMethods` string arrays defined above in `Wallet.isReadyToPayAsync()`.
  - **tokenizationSpecification (_object_)** -- Allows you to configure an account to receive chargeable payment information and identify your gateway and your site's gateway merchant identifier
    - **type (_string_)** -- `"PAYMENT_GATEWAY"` as default in order to retrieve payment information supported by Google Pay API.
    - **parameters (_object_)** -- Parameters specific to the selected payment method tokenization type.
      - **gateway (_string_)** -- Gateway name.
      - **gatewayMerchantId (_string_)** -- Gateway merchant id.

- **transactionInfo (_object_)** -- Describes a transaction that determines a payer's ability to pay. It's used to present a payment authorization dialog.
  - **totalPriceStatus (_string_)** -- The status of the total price used: `NOT_CURRENTLY_KNOWN`: Used for a capability check. `ESTIMATED`: Total price may adjust based on the details of the response, such as sales tax collected based on a billing address. `FINAL`: Total price doesn't change from the amount presented to the shopper.
  - **currencyCode (_string_)** -- ISO 4217 alphabetic currency code.
  - **totalPrice (_optional_) (_string_)** -- Total monetary value of the transaction with an optional decimal precision of two decimal places. This field is required unless totalPriceStatus is set to `NOT_CURRENTLY_KNOWN`. The format of the string should follow the regex format: `^[0-9]+(\.[0-9][0-9])?$`

#### Returns

A `Promise` that resolves to a `string` of payment tokens that can retrieve payments from specified gateway.

**Examples**

```js
const requestData = {
  "merchantInfo": {
    "merchantName": "Example Merchant"
  },
  "allowedPaymentMethods": [
    {
      "type": "CARD",
      "parameters": {
        "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        "allowedCardNetworks": ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
      },
      "tokenizationSpecification": {
        "type": "PAYMENT_GATEWAY",
        "parameters": {
          "gateway": "example",
          "gatewayMerchantId": "exampleGatewayMerchantId"
        }
      }
    }
  ],
  "transactionInfo": {
    "totalPriceStatus": "FINAL",
    "currencyCode": "USD"
    "totalPrice": "12.34",
  }
} );
await Wallet.requestPaymentAsync(requestData);
//return payment tokens
```

## Error Codes

| Code                             | Description                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| ERR_BATTERY_LOW_POWER_UNREADABLE | Unable to access Low Power Mode (iOS) or Power Saver (Android). |

**Examples**

```js
import React from 'react';
import * as Battery from 'expo-battery';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends React.Component {
  state = {
    batteryLevel: null,
  };

  componentDidMount() {
    let batteryLevel = await Battery.getBatteryLevelAsync();
    this.setState({ batteryLevel });
    this._subscribe();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _subscribe = () => {
    this._subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      this.setState({ batteryLevel });
      console.log('batteryLevel changed!', batteryLevel);
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    return (
      <View style={styles.container}>
        <Text>Current Battery Level: {this.state.batteryLevel}</Text>
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
