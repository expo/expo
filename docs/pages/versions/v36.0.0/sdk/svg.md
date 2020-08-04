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

```tsx
import * as React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';

export default function SvgComponent(props) {
  return (
    <Svg height="50%" width="50%" viewBox="0 0 100 100" {...props}>
      <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="2.5" fill="green" />
      <Rect x="15" y="15" width="70" height="70" stroke="red" strokeWidth="2" fill="yellow" />
    </Svg>
  );
}
```

</SnackInline>

### Pro Tips

Here are some helpful links that will get you moving fast!

- 🔎 Looking for SVGs? Try the [noun project](https://thenounproject.com/).
- 🖌 Create or modify your own SVGs for free using [Figma](https://www.figma.com/).
- 🧚‍♀️ Optimize your SVG with [SVGOMG](https://jakearchibald.github.io/svgomg/). This will make the code smaller and easier to work with. Be sure not to remove the `viewbox` for best results on Android.
- 🚀 Convert your SVG to an Expo component in the browser using [React SVGR](https://react-svgr.com/playground/?native=true&typescript=true).
