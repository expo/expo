---
title: Svg
sourceCodeUrl: 'https://github.com/react-native-community/react-native-svg'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`react-native-svg`** allows you to use SVGs in your app, with support for interactivity and animation.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="react-native-svg" href="https://github.com/react-native-community/react-native-svg#with-react-native-cli" />

## API

```js
import * as Svg from 'react-native-svg';
```

### `Svg`

A set of drawing primitives such as `Circle`, `Rect`, `Path`,
`ClipPath`, and `Polygon`. It supports most SVG elements and properties.
The implementation is provided by [react-native-svg](https://github.com/react-native-community/react-native-svg), and documentation is provided in that repository.

<SnackInline label='SVG' dependencies={['react-native-svg']}>

```js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

export default class SvgExample extends React.Component {
  render() {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg height="50%" width="50%" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="2.5" fill="green" />
          <Rect x="15" y="15" width="70" height="70" stroke="red" strokeWidth="2" fill="yellow" />
        </Svg>
      </View>
    );
  }
}
```

</SnackInline>
