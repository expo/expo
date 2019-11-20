---
title: BarCodeScanner
---

A React component that renders a viewfinder for the device's either front or back camera viewfinder and will scan bar codes that show up in the frame.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-barcode-scanner`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-barcode-scanner).

> **Note**: Not compatible with web.

## Supported formats

| Bar code format | iOS   | Android |
| --------------- | ----- | ------- |
| aztec           | Yes   | Yes     |
| codabar         | No    | Yes     |
| code39          | Yes   | Yes     |
| code93          | Yes   | Yes     |
| code128         | Yes   | Yes     |
| code39mod43     | Yes   | No      |
| datamatrix      | Yes   | Yes     |
| ean13           | Yes   | Yes     |
| ean8            | Yes   | Yes     |
| interleaved2of5 | Yes   | No      |
| itf14           | Yes\* | Yes     |
| maxicode        | No    | Yes     |
| pdf417          | Yes   | Yes     |
| rss14           | No    | Yes     |
| rssexpanded     | No    | Yes     |
| upc_a           | No    | Yes     |
| upc_e           | Yes   | Yes     |
| upc_ean         | No    | Yes     |
| qr              | Yes   | Yes     |

- sometimes when an ITF-14 barcode is recognized it's type is set to `interleaved2of5`.

## Usage

You must request permission to access the user's camera before attempting to get it. To do this, you will want to use the [Permissions](../permissions/) API. You can see this in practice in the following example.

```javascript
import * as React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';

import { BarCodeScanner } from 'expo-barcode-scanner';

export default class BarcodeScannerExample extends React.Component {
  state = {
    hasCameraPermission: null,
    scanned: false,
  };

  async componentDidMount() {
    this.getPermissionsAsync();
  }

  getPermissionsAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  };

  render() {
    const { hasCameraPermission, scanned } = this.state;

    if (hasCameraPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    }
    if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    }
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />

        {scanned && (
          <Button title={'Tap to Scan Again'} onPress={() => this.setState({ scanned: false })} />
        )}
      </View>
    );
  }

  handleBarCodeScanned = ({ type, data }) => {
    this.setState({ scanned: true });
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };
}
```

> Note: Passing `undefined` to the `onBarCodeScanned` prop will result in no scanning. This can be used to effectively "pause" the scanner so that it doesn't continually scan even after data has been retrieved.

[Try this example on Snack](https://snack.expo.io/@documentation/barcodescanner-example?platform=ios).

## API

```js
import { BarCodeScanner } from 'expo-barcode-scanner';
```

## Props

- **type (_string_)** -- Camera facing. Use one of `BarCodeScanner.Constants.Type`. Use either `Type.front` or `Type.back`. Same as `Camera.Constants.Type`. Default: `Type.back`.

- **barCodeTypes (_Array\<string\>_)** -- An array of bar code types. Usage: `BarCodeScanner.Constants.BarCodeType.<codeType>` where `codeType` is one of the listed above. Default: all supported bar code types. For example: `barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}`

- **onBarCodeScanned (_function_)** -- A callback that is invoked when a bar code has been successfully scanned. The callback is provided with an object of the shape `{ type: BarCodeScanner.Constants.BarCodeType, data: string }`, where the type refers to the bar code type that was scanned and the data is the information encoded in the bar code (in this case of QR codes, this is often a URL).

## Methods

### `BarCodeScanner.scanFromURLAsync(url, barCodeTypes)`

Scan bar codes from the image given by the URL.

#### Arguments

- **url (_string_)** -- URL to get the image from.
- **barCodeTypes (_Array\<BarCodeScanner.Constants.BarCodeType\>_)** -- (as in prop) An array of bar code types. Default: all supported bar code types.
  > Note: Only QR codes are supported on iOS.

#### Returns

A possibly empty array of objects of the shape `{ type: BarCodeScanner.Constants.BarCodeType, data: string }`, where the type refers to the bar code type that was scanned and the data is the information encoded in the bar code.
