---
title: Screens
sourceCodeUrl: 'https://github.com/kmagiera/react-native-screens'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

**`react-native-screens`** provides native primitives to represent screens instead of plain `<View>` components in order to better take advantage of operating system behavior and optimizations around screens. Used by library authors, unlikely to be used directly by most app developers.

> Note: this library is still in alpha. Please refer to [the issue tracker](https://github.com/kmagiera/react-native-screens/issues) if you encounter any problems.

<PlatformsSection android emulator ios simulator web />

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-screens`. In bare apps, make sure you also follow the [react-native-screens linking and configuration instructions](https://github.com/kmagiera/react-native-screens).

## API

To use `react-native-screens` with `react-navigation`, you will need to enable it before rendering any screens. Add the following code to your main application file (e.g. App.js):

```js
import { enableScreens } from 'react-native-screens';
enableScreens();
```

More information on usage for library authors is available [in the README](https://github.com/kmagiera/react-native-screens).
