---
title: Checkbox
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-checkbox'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-checkbox`** provides a basic `boolean` input element for all platforms. If you are looking for a more flexible checkbox component, please see the [guide to implementing your own checkbox](/ui-programming/implementing-a-checkbox.md).

<PlatformsSection android emulator web ios simulator />

## Installation

<InstallSection packageName="expo-checkbox" hideBareInstructions />

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

<APISection packageName="expo-checkbox" apiName="Checkbox" />