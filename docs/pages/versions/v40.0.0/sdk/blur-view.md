---
title: BlurView
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-40/packages/expo-blur'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

A React component that blurs everything underneath the view. On iOS, it renders a native blur view. On Android, it falls back to a semi-transparent view. Common usage of this is for navigation bars, tab bars, and modals.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-blur" />

## Usage

<SnackInline label='Basic BlurView usage' templateId="blur-view" dependencies={['expo-blur']}>

```js
import React from 'react';
import { Image, Text, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

const uri = 'https://s3.amazonaws.com/exp-icon-assets/ExpoEmptyManifest_192.png';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image style={styles.blurredImage} source={{ uri }} />

        {/* Adjust the tint and intensity */}
        <BlurView intensity={100} style={[StyleSheet.absoluteFill, styles.nonBlurredContent]}>
          <Text>Hello! I am bluring contents underneath</Text>
        </BlurView>
      </View>
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
