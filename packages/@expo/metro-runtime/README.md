# @expo/metro-runtime

Injects runtime code required for advanced Metro bundling features in the Expo ecosystem.

## Usage

> `expo-router` users do not need to install this package, it is already included.

```js
yarn add @expo/metro-runtime
```

Import this somewhere in the initial bundle. For example, the `App.js`:

```js
import '@expo/metro-config';
```

`expo/metro-config` will automatically move this import to be first in the bundle.
