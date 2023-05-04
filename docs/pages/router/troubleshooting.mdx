---
title: Troubleshooting
description: Fixing common issues with Expo Router setup.
sidebar_position: 99
---

## `EXPO_ROUTER_APP_ROOT` not defined

If you see an error like this:

```
Invalid call at line 11: process.env.EXPO_ROUTER_APP_ROOT First argument of require.context should be a string.
```

It is because `process.env.EXPO_ROUTER_APP_ROOT` is not defined. This can happen when:

- The project is using an `expo` version lower than `expo@^46.0.13`. The version `46.0.13` enables context modules and injects `process.env.EXPO_ROUTER_APP_ROOT` into the process.
- The babel plugin `expo-router/babel` is not being used in the project `babel.config.js`. You can try clearing the cache with `npx expo start --clear`.

Alternatively you can circumvent this issue by creating an `index.js` file in the root of your project with the following contents:

```js
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
```

> Do not use this to change the root directory (app) as it won't account for usage in any other places.

## `require.context` not enabled

- This can happen if you are using an `expo` version lower than `expo@^46.0.13`. The version `46.0.13` enables context modules and injects `process.env.EXPO_ROUTER_APP_ROOT` into the process.
- This can also be the result of using a custom version of `@expo/metro-config` that does not enable context modules.
- Expo Router requires the project `metro.config.js` file to use `expo-router/metro` as the default configuration. Delete the `metro.config.js` file, or extend `expo/metro-config`. [Learn more](https://docs.expo.dev/guides/customizing-metro/)
