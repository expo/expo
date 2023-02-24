---
title: '"React Native version mismatch" errors'
---

When developing an Expo or React Native app, it's not uncommon to run into an error that looks like:

```
React Native version mismatch.

JavaScript version: X.XX.X
Native version: X.XX.X

Make sure you have rebuilt the native code...
```

## What this error means

The bundler that you're running in your terminal (via `npx expo start`) is using a different JavaScript version of `react-native` than the native app on your device or emulator. This can happen after upgrading your React Native or Expo SDK version, _or_ when connecting to the wrong local development server.

## How to fix it

- Close out any development servers that you have running (you can list all terminal processes with the `ps` command, and search for Expo CLI or React Native community CLI processes with `ps -A | grep "expo\|react-native"`).

- If this is a managed workflow project, either remove the `sdkVersion` field from your **app.json** file, or make sure it matches the value of the `expo` dependency in your **package.json** file.

- If this is a managed workflow project, you should make sure your `react-native` version is correct. Run `expo-cli doctor` will show a warning where the `react-native` version you should install. If you did upgrade to newer SDK, make sure to run `expo-cli upgrade` and follow the prompts. Expo CLI will make sure that your dependency versions for packages like `expo` and `react-native` are aligned.

- If this is a bare workflow project, and this error is occurring right after upgrading your React Native version, you should double-check that you've performed each of the upgrade steps correctly.

- Finally:
  - Clear your bundler caches by running `rm -rf node_modules && npm cache clean --force && npm install && watchman watch-del-all && rm -rf $TMPDIR/haste-map-* && rm -rf $TMPDIR/metro-cache && expo start --clear`
    - Commands if you are using npm can be found [here.](clear-cache-macos-linux)
    - Commands if you are using Windows can be found [here.](clear-cache-windows)
  - If this is a bare workflow project, run `npx pod-install`, then rebuild your native projects (run `yarn android` to rebuild for Android, and `yarn ios` to rebuild iOS)
