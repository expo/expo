---
title: BarCodeScanner
---

A React component that renders a viewfinder for the device's either front or back camera viewfinder and will detect bar codes that show up in the frame.

Requires `Permissions.CAMERA`.

## Supported formats

| Bar code format | iOS | Android |
| --------------- | --- | ------- |
| aztec           | Yes | Yes     |
| codabar         | No  | Yes     |
| code39          | Yes | Yes     |
| code93          | Yes | Yes     |
| code128         | Yes | Yes     |
| code138         | Yes | No      |
| code39mod43     | Yes | No      |
| datamatrix      | Yes | Yes     |
| ean13           | Yes | Yes     |
| ean8            | Yes | Yes     |
| interleaved2of5 | Yes | Yes     |
| itf14           | Yes | No      |
| maxicode        | No  | Yes     |
| pdf417          | Yes | Yes     |
| rss14           | No  | Yes     |
| rssexpanded     | No  | Yes     |
| upc_a           | No  | Yes     |
| upc_e           | Yes | Yes     |
| upc_ean         | No  | Yes     |
| qr              | Yes | Yes     |

### Example

```javascript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner, Permissions } from 'expo';

export default class BarcodeScannerExample extends React.Component {
  state = {
    hasCameraPermission: null,
  }

  async componentWillMount() {
    /* @info Before we can use the BarCodeScanner we need to ask the user for permission to access their camera. <a href='permissions.html'>Read more about Permissions.</a> */
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({hasCameraPermission: status === 'granted'});
    /* @end */
  }

  render() {
    const { hasCameraPermission } = this.state;

    if (hasCameraPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          /* @info The BarCodeScanner is a component that renders the viewfinder from the user's camera. If you render it without having user permission to use the camera, the view will be black. */
          <BarCodeScanner
            onBarCodeRead={this._handleBarCodeRead}
            style={StyleSheet.absoluteFill}
          />/* @end */

        </View>
      );
    }
  }

  _handleBarCodeRead = (/* @info We destructure the bar code result object into <em>type</em> and <em>data</em>*/{ type, data }/* @end */) => {
    /* @info Here we just alert the information for the sake of the example */
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);/* @end */

  }
}
```

[Try this example on Snack](https://snack.expo.io/Skxzn6-5b).


### props

- **onBarCodeRead (_function_)** -- A callback that is invoked when a bar code has been successfully read. The callback is provided with an Object of the shape `{ type: string, data: string }`, where the type refers to the bar code type that was scanned and the data is the information encoded in the bar code (in this case of QR codes, this is often a URL)

- **type (_string_)** -- When `'front'`, use the front-facing camera. When `'back'`, use the back-facing camera. Default: `'back'`.

- **torchMode (_string_)** -- When `'on'`, the flash on your device will turn on, when `'off'`, it will be off. Defaults to `'off'`.

- **barCodeTypes (_Array<string>_)** -- An array of bar code types. Usage: `BarCodeScanner.Constants.BarCodeType.<codeType>` where `codeType` is one of the listed above. Default: all supported bar code types. For example: `barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}`