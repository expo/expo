---
title: Checkbox
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-checkbox'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-checkbox`** provides a component to provide a `boolean` input element on Android and Web.

<PlatformsSection android emulator web />

## Installation

<InstallSection packageName="expo-checkbox" />

## Usage

<SnackInline label='Basic Checkbox usage' dependencies={['expo-checkbox']} platforms={['android', 'web']}>

```js
import Checkbox from 'expo-checkbox';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [isChecked, setChecked] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Checkbox style={styles.checkbox} value={isChecked} onValueChange={setChecked} />
        <Text style={styles.paragraph}>Normal checkbox</Text>
      </View>
      <View style={styles.section}>
        <Checkbox
          style={styles.checkbox}
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? '#4630EB' : undefined}
        />
        <Text style={styles.paragraph}>Custom colored checkbox</Text>
      </View>
      <View style={styles.section}>
        <Checkbox style={styles.checkbox} disabled value={isChecked} onValueChange={setChecked} />
        <Text style={styles.paragraph}>Disabled checkbox</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 32,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 15,
  },
  checkbox: {
    margin: 8,
  },
});
```

</SnackInline>

## API

```js
import Checkbox from 'expo-checkbox';
```

## Static Methods

### `Checkbox.isAvailableAsync(): Promise<boolean>`

Determines whether the checkbox is available.

#### Returns

Returns a promise that resolves to a `Boolean`, indicating whether the checkbox is available on this device.

## Props

The checkbox component inherits all [view props](../react-native/view.md#props).

### `value`

**(_boolean_)** Value indicating if the checkbox should be rendered as checked or not.

### `disabled`

**(_boolean_)** If the checkbox is disabled, making it opaque and uncheckable.

### `color`

**(_string_)** The tint or color of the checkbox. This overrides the disabled opaque style.

### `onChange`

**(_function_)** Callback that is invoked when the user presses the checkbox. The callback is provided with event containing the checkbox change, `{ nativeEvent: { target, value } }`.

### `onValueChange`

**(_function_)** Callback that is invoked when the user presses the checkbox. The callback is provided with a `boolean` indicating the new checked state of the checkbox.
