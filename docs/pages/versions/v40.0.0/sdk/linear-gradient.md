---
title: LinearGradient
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-40/packages/expo-linear-gradient'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-linear-gradient`** provides a native React view that transitions between multiple colors in a linear direction.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-linear-gradient" />

## Usage

<SnackInline label='Linear Gradient' dependencies={['expo-linear-gradient']}>

```tsx
import * as React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FacebookButton() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'orange',
      }}>
      <LinearGradient
        // Background Linear Gradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 300,
        }}
      />
      <LinearGradient
        // Button Linear Gradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={{ padding: 15, alignItems: 'center', borderRadius: 5 }}>
        <Text
          style={{
            backgroundColor: 'transparent',
            fontSize: 15,
            color: '#fff',
          }}>
          Sign in with Facebook
        </Text>
      </LinearGradient>
    </View>
  );
}
```

</SnackInline>

## API

```js
import { LinearGradient } from 'expo-linear-gradient';
```

### props

`colors`  
An array of colors that represent stops in the gradient. At least two colors are required (for a single-color background, use the `style.backgroundColor` prop on a `View` component).

`start`  
An object `{ x: number; y: number }` or array `[x, y]` that represents the point at which the gradient starts, as a fraction of the overall size of the gradient ranging from 0 to 1, inclusive.
For example, `{ x: 0.1, y: 0.2 }` means that the gradient will start `10%` from the left and `20%` from the top.
**On web**, this only changes the angle of the gradient because CSS gradients don't support changing the starting position.

`end`  
An object `{ x: number; y: number }` or array `[x, y]` that represents the position at which the gradient ends, as a fraction of the overall size of the gradient ranging from 0 to 1, inclusive.
For example, `{ x: 0.1, y: 0.2 }` means that the gradient will end `10%` from the left and `20%` from the bottom.
**On web**, this only changes the angle of the gradient because CSS gradients don't support changing the end position.

`locations`  
An array that contains `number`s ranging from 0 to 1, inclusive, and is the same length as the `colors` property. Each number indicates a color-stop location where each respective color should be located.
For example, `[0.5, 0.8]` would render:

- the first color, solid, from the beginning of the gradient view to 50% through (the middle);
- a gradient from the first color to the second from the 50% point to the 80% point; and
- the second color, solid, from the 80% point to the end of the gradient view.

The color-stop locations must be ascending from least to greatest.
