---
title: Screens
sourceCodeUrl: 'https://github.com/software-mansion/react-native-screens'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`react-native-screens`** provides native primitives to represent screens instead of plain `<View>` components in order to better take advantage of operating system behavior and optimizations around screens. This capability is used by library authors and unlikely to be used directly by most app developers. It also provides the native components needed for React Navigation's [createNativeStackNavigator](https://reactnavigation.org/docs/native-stack-navigator).

> Note: Please refer to [the issue tracker](https://github.com/software-mansion/react-native-screens/issues) if you encounter any problems.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="react-native-screens" href="https://github.com/software-mansion/react-native-screens" />

## API

The complete API reference and documentation is available [in the README](https://github.com/software-mansion/react-native-screens).

To use `react-native-screens` with React Navigation, you will need to enable it before rendering any screens. Add the following code to your main application file (e.g. App.js):

```js
import { enableScreens } from 'react-native-screens';
enableScreens();
```

To use the native stack navigator, refer to the [createNativeStackNavigator documentation](https://reactnavigation.org/docs/native-stack-navigator).