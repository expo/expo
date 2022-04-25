---
title: BarCodeScanner
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-barcode-scanner'
packageName: 'expo-barcode-scanner'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-barcode-scanner`** provides a React component that renders a viewfinder for the device's camera (either front or back) and will scan bar codes that show up in the frame.

<PlatformsSection android emulator ios simulator web />

> **Note:** Only one active BarCodeScanner preview is supported currently. When using navigation, the best practice is to unmount any previously rendered BarCodeScanner component so the following screens can use `<BarCodeScanner />` without issues.

## Installation

<APIInstallSection />

## Configuration

In managed apps, scanning barcodes with the camera requires the [`Permission.CAMERA`](permissions.md#permissionscamera) permission. See the [usage example](#usage) below.

## Supported formats

| Bar code format | iOS   | Android     |
| --------------- | ----- | ----------- |
| aztec           | Yes   | Yes         |
| codabar         | Yes   | Yes         |
| code39          | Yes   | Yes         |
| code93          | Yes   | Yes         |
| code128         | Yes   | Yes         |
| code39mod43     | Yes   | No          |
| datamatrix      | Yes   | Yes         |
| ean13           | Yes   | Yes         |
| ean8            | Yes   | Yes         |
| interleaved2of5 | Yes   | use `itf14` |
| itf14           | Yes\* | Yes         |
| maxicode        | No    | Yes         |
| pdf417          | Yes   | Yes         |
| rss14           | No    | Yes         |
| rssexpanded     | No    | Yes         |
| upc_a           | No    | Yes         |
| upc_e           | Yes   | Yes         |
| upc_ean         | No    | Yes         |
| qr              | Yes   | Yes         |

> __Notes:__
> - When an ITF-14 barcode is recognized, it's type can sometimes be set to `interleaved2of5`.
> - Scanning for either `PDF417` and/or `Code39` formats can result in a noticeable increase in battery consumption on iOS. It is recommended to provide only the bar code formats you expect to scan to the `barCodeTypes` prop.

## Usage

You must request permission to access the user's camera before attempting to get it. To do this, you will want to use the [Permissions](permissions.md) API. You can see this in practice in the following example.

<SnackInline label="Basic BarCodeScanner usage" dependencies={['expo-barcode-scanner']}>

```jsx
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import { BarCodeScanner } from 'expo-barcode-scanner';
```

<APISection packageName="expo-barcode-scanner" apiName="BarCodeScanner" />
