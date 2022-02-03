---
title: Haptics
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-haptics'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-haptics`** provides haptic (touch) feedback for

- iOS 10+ devices using the Taptic Engine
- Android devices using Vibrator system service.

On iOS, _the Taptic engine will do nothing if any of the following conditions are true on a user's device:_

- Low Power Mode is enabled ([Feature Request](https://expo.canny.io/feature-requests/p/expose-low-power-mode-ios-battery-saver-android))
- User disabled the Taptic Engine in settings ([Feature Request](https://expo.canny.io/feature-requests/p/react-native-settings))
- Haptic engine generation is too low (less than 2nd gen) - Private API
  - Using private API will get your app rejected: `[[UIDevice currentDevice] valueForKey: @"_feedbackSupportLevel"]` so this is not added in Expo
- iOS version is less than 10 (iPhone 7 is the first phone to support this)
  - This could be found through: `Constants.platform.ios.systemVersion` or `Constants.platform.ios.platform`

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-haptics" />

## Configuration

On Android, this module requires permission to control vibration on the device. The `VIBRATE` permission is added automatically.

## Usage

<SnackInline label='Haptics usage' dependencies={['expo-haptics']}>

```jsx
import * as React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Haptics.selectionAsync</Text>
      <View style={styles.buttonContainer}>
        <Button title='Selection' onPress={() => /* @info */ Haptics.selectionAsync() /* @end */} />
      </View>
      <Text style={styles.text}>Haptics.notificationAsync</Text>
      <View style={styles.buttonContainer}>
        <Button title='Success' onPress={() => /* @info */ Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) /* @end */} />
        <Button title='Error' onPress={() => /* @info */ Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) /* @end */} />
        <Button title='Warning' onPress={() => /* @info */ Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) /* @end */} />
      </View>
      <Text style={styles.text}>Haptics.impactAsync</Text>
      <View style={styles.buttonContainer}>
        <Button title='Light' onPress={() => /* @info */ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) /* @end */} />
        <Button title='Medium' onPress={() => /* @info */ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) /* @end */} />
        <Button title='Heavy' onPress={() => /* @info */ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) /* @end */} />
      </View>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 10,
    marginBottom: 30,
    justifyContent: 'space-between'
  },
});
/* @end */
```

</SnackInline>

## API

```js
import * as Haptics from 'expo-haptics';
```

<APISection packageName="expo-haptics" apiName="Haptics" />