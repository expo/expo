---
title: TrackingTransparency
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-42/packages/expo-tracking-transparency'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

A library for requesting permission to track the user or their device. Examples of data used for tracking include email address, device ID, advertising ID, etc... This permission is only necessary on iOS 14 and higher; on iOS 13 and below this permission is always granted. If the "Allow Apps to Request to Track" device-level setting is off, this permission will be denied. Be sure to add `NSUserTrackingUsageDescription` to your [**Info.plist**](https://docs.expo.dev/versions/latest/config/app/#infoplist) to explain how the user will be tracked, otherwise your app will be rejected by Apple.

For more information on Apple's new App Tracking Transparency framework, please refer to their [documentation](https://developer.apple.com/app-store/user-privacy-and-data-use/).

<PlatformsSection ios simulator />

## Installation

<InstallSection packageName="expo-tracking-transparency" />

## Usage

<SnackInline label='Basic tracking transparency usage' dependencies={['expo-tracking-transparency']}>

```jsx
import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await requestTrackingPermissionsAsync();
      if (status === 'granted') {
        console.log('Yay! I have user permission to track data');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Tracking Transparency Module Example</Text>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
```

<APISection packageName="expo-tracking-transparency" />
