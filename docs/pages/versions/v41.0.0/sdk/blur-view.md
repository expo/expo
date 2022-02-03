---
title: BlurView
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-41/packages/expo-blur'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

A React component that blurs everything underneath the view. On iOS, it renders a native blur view. On Android, it falls back to a semi-transparent view. Common usage of this is for navigation bars, tab bars, and modals.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-blur" />

## Usage

<SnackInline label='Basic BlurView usage' dependencies={['expo-blur']}>

```jsx
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

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurredImage: {
    width: 192,
    height: 192,
  },
  nonBlurredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import { BlurView } from 'expo-blur';
```

<APISection packageName="expo-blur" />
