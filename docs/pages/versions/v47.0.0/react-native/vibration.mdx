---
id: vibration
title: Vibration
---

Vibrates the device.

## Example

```js
import React from 'react';
import { Button, Platform, Text, Vibration, View, SafeAreaView, StyleSheet } from 'react-native';

const Separator = () => {
  return <View style={Platform.OS === 'android' ? styles.separator : null} />;
};

const App = () => {
  const ONE_SECOND_IN_MS = 1000;

  const PATTERN = [1 * ONE_SECOND_IN_MS, 2 * ONE_SECOND_IN_MS, 3 * ONE_SECOND_IN_MS];

  const PATTERN_DESC =
    Platform.OS === 'android'
      ? 'wait 1s, vibrate 2s, wait 3s'
      : 'wait 1s, vibrate, wait 2s, vibrate, wait 3s';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[styles.header, styles.paragraph]}>Vibration API</Text>
      <View>
        <Button title="Vibrate once" onPress={() => Vibration.vibrate()} />
      </View>
      <Separator />
      {Platform.OS == 'android'
        ? [
            <View>
              <Button
                title="Vibrate for 10 seconds"
                onPress={() => Vibration.vibrate(10 * ONE_SECOND_IN_MS)}
              />
            </View>,
            <Separator />,
          ]
        : null}
      <Text style={styles.paragraph}>Pattern: {PATTERN_DESC}</Text>
      <Button title="Vibrate with pattern" onPress={() => Vibration.vibrate(PATTERN)} />
      <Separator />
      <Button
        title="Vibrate with pattern until cancelled"
        onPress={() => Vibration.vibrate(PATTERN, true)}
      />
      <Separator />
      <Button title="Stop vibration pattern" onPress={() => Vibration.cancel()} color="#FF0000" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 44,
    padding: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paragraph: {
    margin: 24,
    textAlign: 'center',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default App;
```

> Android apps should request the `android.permission.VIBRATE` permission by adding `<uses-permission android:name="android.permission.VIBRATE"/>` to **AndroidManifest.xml**.

> The Vibration API is implemented as a `AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)` call on iOS.

---

# Reference

## Methods

### `cancel()`

```js
Vibration.cancel();
```

Call this to stop vibrating after having invoked `vibrate()` with repetition enabled.

---

### `vibrate()`

```js
Vibration.vibrate(pattern, repeat);
```

Triggers a vibration with a fixed duration.

**On Android,** the vibration duration defaults to 400 milliseconds, and an arbitrary vibration duration can be specified by passing a number as the value for the `pattern` argument. **On iOS,** the vibration duration is fixed at roughly 400 milliseconds.

The `vibrate()` method can take a `pattern` argument with an array of numbers that represent time in milliseconds. You may set `repeat` to true to run through the vibration pattern in a loop until `cancel()` is called.

**On Android,** the odd indices of the `pattern` array represent the vibration duration, while the even ones represent the separation time. **On iOS,** the numbers in the `pattern` array represent the separation time, as the vibration duration is fixed.

**Parameters:**

| Name    | Type                                       | Default | Description                                                                                       |
| ------- | ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------- |
| pattern | number **(Android)** <hr/>array of numbers | `400`   | Vibration duration in milliseconds.<hr/>Vibration pattern as an array of numbers in milliseconds. |
| repeat  | boolean                                    | `false` | Repeat vibration pattern until `cancel()`.                                                        |
