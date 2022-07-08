---
title: BlurView
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-46/packages/expo-blur'
packageName: 'expo-blur'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

A React component that blurs everything underneath the view. On iOS, it renders a native blur view. On Android, it falls back to a semi-transparent view. Common usage of this is for navigation bars, tab bars, and modals.

<PlatformsSection ios simulator web />

## Installation

<APIInstallSection />

## Usage

<SnackInline label='Basic BlurView usage' dependencies={['expo-blur']}>

```jsx
import React from 'react';
import { Image, Text, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

const uri = 'https://s3.amazonaws.com/exp-icon-assets/ExpoEmptyManifest_192.png';

export default function App() {
  const text = 'Hello, my container is blurring contents underneath!';
  return (
    <View style={styles.container}>
      <Image style={[StyleSheet.absoluteFill, styles.image]} source={{ uri }} />
      <BlurView intensity={100} style={styles.blurContainer}>
        <Text style={styles.text}>{text}</Text>
      </BlurView>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <Text style={styles.text}>{text}</Text>
      </BlurView>
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <Text style={[styles.text, { color: '#fff' }]}>{text}</Text>
      </BlurView>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '600'
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
