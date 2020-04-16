---
title: BlurView
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-blur'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

A React component that renders a native blur view on iOS and falls back to a semi-transparent view on Android. A common usage of this is for navigation bars, tab bars, and modals.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-blur" />

## Usage

<SnackInline label='Basic BlurView usage' templateId="blur-view" dependencies={['expo-blur']}>

```js
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
const uri = 'https://s3.amazonaws.com/exp-icon-assets/ExpoEmptyManifest_192.png';

export default function App() {
  return (
    <View style={styles.container}>
      <Image style={{ width: 192, height: 192 }} source={{ uri }} />

      {/* Adjust the tint and intensity */}
      <BlurView tint="light" intensity={50} style={styles.notBlurred}>
        <Image style={{ width: 96, height: 96 }} source={{ uri }} />
      </BlurView>
    </View>
  );
}
```

</SnackInline>

## API

```js
import { BlurView } from 'expo-blur';
```

## Props

- **tint (string)** -- `light`, `default` or `dark`.
- **intensity (number)** -- A number from `1` to `100` to control the intensity of the blur effect.

#
