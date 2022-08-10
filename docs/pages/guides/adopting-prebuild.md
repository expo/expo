---
title: Adopting Prebuild
---

import { Terminal } from '~/ui/components/Snippet';

There are many advantages to using Prebuild to manage your native projects. This guide will show you how to adopt prebuilding in a project that was bootstrapped with `npx react-native init`.

> **Note:** Adopting prebuild automatically adds support for developing modules with the [Sweet API][expo-modules-core] by linking `expo-modules-core` natively. You can also use any command from Expo CLI `npx expo` in your project.

## Bootstrap a new project

<!-- NOTE: Update the version when we bump support -->

<Terminal cmd={["$ npx react-native init --version 0.69.4"]} />

This will create a new React Native project. Note that not all versions of `react-native` are supported, be sure to use a version of `react-native` that has a corresponding Expo SDK version.

## Install the `expo` package

The `expo` package contains the `npx expo prebuild` command and indicates which prebuild template to use:

<Terminal cmd={["$ yarn add expo"]} />

Ensure you install the version of `expo` that works for your currently installed version of `react-native`. Note that not all major versions of `react-native` are supported.

## Update the entry file

Modify the entry file like so:

```diff
+ import {registerRootComponent} from 'expo';

- import {AppRegistry} from 'react-native';
import App from './App';
- import {name as appName} from './app.json';

- AppRegistry.registerComponent(appName, () => App);
+ registerRootComponent(App);
```

Alternatively, you can just change `appName` to `"main"`. Switching to `registerRootComponent` is useful if you want to take advantage of other features like web support. Importing `expo` adds side-effects for development environments that are removed in production bundles, meaning there isn't some massive bundle size increase.

## Prebuild

> **Warning:** Make sure you've committed your changes in case you want to revert, the command will warn you about this too!

Run the following command to regenerate the `/ios` and `/android` directories based on the `app.json` configuration.

<Terminal cmd={[
'$ npx expo prebuild --clean',
]} cmdCopy="npx expo prebuild --clean" />

You can test that everything worked by building the projects locally:

<Terminal cmd={[
'# Build your native Android project',
'$ npx expo run:android',
'',
'# Build your native iOS project',
'$ npx expo run:ios'
]} />

## Extra changes

The following changes are optional but recommended.

**.gitignore**

You can add `.expo/` to your `.gitignore` to prevent generated values from Expo CLI from being committed. You can also add `ios/` and `android/` to the `.gitignore` if you want to ensure they aren't committed between prebuilds.

**app.json**

Remove all fields that are outside of the top-level `expo` object as these will not be used in `npx expo prebuild`.

```diff
{
-  "name": "myapp",
-  "displayName": "myapp"
+  "expo": {
+    "name": "myapp"
+  }
}
```

**metro.config.js**

- See [Customizing Metro](/guides/customizing-metro.md)

**package.json**

You may want to change the scripts to use the Expo CLI run commands:

```diff
  "scripts": {
    "start": "expo start --dev-client",
-    "android": "react-native run-android",
-    "ios": "react-native run-ios",
+    "android": "expo run:android",
+    "ios": "expo run:ios",
  },
```

These have better logging, auto code signing, better simulator handling, and they ensure you run `npx expo start` to host files.

## Advanced Migration

If you're project already has a number of custom native modifications then you'll need to configure your Expo config (`app.json`) to reflect those native changes. There is currently no automated system for doing this. So instead we'll provide some pointers:

- Check to see if your changes overlap with the built-in [Expo config fields](/versions/latest/config/app/). For example, if you have an app icon, be sure to define it as `expo.icon` in the `app.json` then re-run `npx expo prebuild`.
- Look up if any of the packages you're using require an [Expo Config Plugin][config-plugins]. If a package in your project required additional changes inside of the `ios/` or `android/` folders, then you will probably need a Config Plugin. Some plugins can be automatically added by running `npx expo install` with all of the packages in your `package.json` `dependencies`. If a package requires a plugin but doesn't supply one, then you can try checking the community plugins at [`expo/config-plugins`](https://github.com/expo/config-plugins) to see if one already exists.
- You can use the [VS code Expo extension][vs-code-expo] to "introspect" your changes and debug if prebuild is generating the native code you expect. Just press `cmd+shift+P`, type "Expo: Preview Modifier", and select the native file you wish to introspect.
- Additionally, you can develop local Config Plugins to fit your needs. [Learn more](/guides/config-plugins#developing-a-plugin).

## Adding More Features

Prebuild is the tip of the automation iceberg, here are some features you can adopt next:

- [EAS Build](/build/setup): Code signing and cloud building.
- [EAS Update](/build/updates): Send over-the-air updates instantly.
- [Expo for web](/workflow/web): Run your app in the browser.
- [Expo Dev Client][dev-client]: Improved developer experience for teams.
- [Sweet API][expo-modules-core]: Write modules with Swift and Kotlin. This is automatically supported when using `npx expo prebuild`.

[vs-code-expo]: https://marketplace.visualstudio.com/items?itemName=byCedric.vscode-expo
[expo-modules-core]: /modules/module-api
[dev-client]: /development/introduction
[config-plugins]: /guides/config-plugins
