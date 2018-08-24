# expo-barcode-scanner

`expo-barcode-scanner` module allows scanning variety of supported barcodes both as standalone module and as extension for [`expo-camera`](https://github.com/expo/expo-camera). It also allows scanning barcodes from existing images.

## Installation

*If your app is running in [Expo](https://expo.io) then everything is already set up for you, just `import { BarCodeScanner } from 'expo';`*

Otherwise, you need to install the package from `npm` registry.

`yarn add expo-barcode-scanner` or `npm install expo-barcode-scanner` (that would install `expo-barcode-scanner-interface` as well)

Also, make sure that you have [expo-core](https://github.com/expo/expo-core) and [expo-permissions](https://github.com/expo/expo-permissions) installed, as they are required by `expo-barcode-scanner` to work properly.

### iOS (Cocoapods)

Add the dependency to your `Podfile`:

```ruby
pod 'EXBarCodeScannerInterface', path: '../node_modules/expo-barcode-scanner-interface/ios'
pod 'EXBarCodeScanner', path: '../node_modules/expo-barcode-scanner/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-barcode-scanner-interface'
    project(':expo-barcode-scanner-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-barcode-scanner-interface/android')
    
    include ':expo-barcode-scanner'
    project(':expo-barcode-scanner').projectDir = new File(rootProject.projectDir, '../node_modules/expo-barcode-scanner/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-barcode-scanner-interface')
    compile project(':expo-barcode-scanner')
    ```
3.  Add `new BarCodeScannerPackage()` to your module registry provider in `MainApplication.java`.

## Supported formats

| Bar code format | iOS   | Android |
| --------------- | ----- | ------- |
| aztec           | Yes   | Yes     |
| codabar         | No    | Yes     |
| code39          | Yes   | Yes     |
| code93          | Yes   | Yes     |
| code128         | Yes   | Yes     |
| code138         | Yes   | No      |
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

* sometimes when an ITF-14 barcode is recognized it's type is set to `interleaved2of5`.

## Usage

You must request permission to access the user's camera before attempting to get it. To do this, you will want to use the [Permissions](https://github.com/expo/expo-permissions) API. You can see this in practice in the following example.

```javascript
import React from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Permissions } from 'expo-permissions';

export default class BarcodeScannerExample extends React.Component {
  state = {
    hasPermissionsGranted: null,
    type: BarCodeScanner.Constants.Type.back,
  };

  async componentDidMount() {
    let { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasPermissionsGranted: (status === 'granted') });
  }

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    }
    if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    }
    return (
      <View style={{ flex: 1 }}>
        <BarCodeScanner
          onBarCodeScanned={data => alert(JSON.stringify(data))}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.qr,
            BarCodeScanner.Constants.BarCodeType.pdf417,
          ]}
          type={this.state.type}
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <TouchableOpacity
          style={{
            flex: 0.1,
            alignSelf: 'flex-end',
            alignItems: 'center',
          }}
          onPress={() => this.setState({ type:
            this.state.type === BarCodeScanner.Constants.Type.back
              ? BarCodeScanner.Constants.Type.front
              : BarCodeScanner.Constants.Type.back,
          })}
        >
          <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Flip </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
```

## Props

* **type**

Camera facing. Use one of `BarCodeScanner.Constants.Type`. Use either `Type.front` or `Type.back`. Same as `Camera.Constants.Type`. Default: `Type.back`.

* **barCodeTypes (_Array<BarCodeScanner.Constants.BarCodeType>_)**

An array of bar code types. Usage: `BarCodeScanner.Constants.BarCodeType.<codeType>` where `codeType` is one of the listed below. Default: all supported bar code types. For example: `barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}`

* **onBarCodeScanned (_function_)**

Callback that is invoked when a bar code has been successfully scanned. The callback is provided with an Object of the shape `{ type: BarCodeScanner.Constants.BarCodeType, data: string }`, where the type refers to the bar code type that was scanned and the data is the information encoded in the bar code (in this case of QR codes, this is often a URL)

## Methods

### `Expo.BarCodeScanner.scanFromURLAsync(url, barCodeTypes)`

Scan bar codes from the image given by the URL.

#### Arguments

-   **url (_string_)** -- URL to get the image from.
-   **barCodeTypes (_Array<BarCodeScanner.Constants.BarCodeType>_)** -- (as in prop) An array of bar code types. Default: all supported bar code types.
> Note: Only QR codes are supported on iOS.

#### Returns

A possibly empty array of objects of the shape `{ type: BarCodeScanner.Constants.BarCodeType, data: string }`, where the type refers to the bar code type that was scanned and the data is the information encoded in the bar code.
