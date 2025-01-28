---
title: Adopt Prebuild
description: Learn how to adopt Expo Prebuild in a project that was bootstrapped with React Native CLI.
---

import { Terminal } from '~/ui/components/Snippet';

There are [many advantages](/workflow/prebuild#pitch) of using [Expo Prebuild][prebuild] to [continuously generate your native projects](/workflow/continuous-native-generation). This guide will show you how to adopt Expo Prebuild in a project that was bootstrapped with `npx @react-native-community/cli@latest init`. The amount of time it will take to convert your project depends on the amount of custom native changes that you have made to your Android and iOS native projects. This may take a minute or two on a brand new project, and on a large project, it will be much longer.

Adopting prebuild will automatically add support for developing modules with the [Expo native module API][expo-modules-core] by linking `expo-modules-core` natively. You can also use any command from [Expo CLI][cli] in your project.

> **warning** [Not all versions of `react-native` are explicitly supported](/versions/latest/#each-expo-sdk-version-depends-on-a-react-native-version). Make sure to use a version of `react-native` that has a corresponding Expo SDK version.

## Install the `expo` package

The `expo` package contains the [`npx expo prebuild`](/more/expo-cli/#prebuild) command and indicates which [prebuild template](/workflow/prebuild#templates) to use:

<Terminal cmd={['$ npm install expo']} />

Ensure you install the version of `expo` that works for your currently installed [version of `react-native`](/versions/latest/#each-expo-sdk-version-depends-on-a-react-native-version).

## Update the entry file

Modify the entry file to use [`registerRootComponent`](/versions/latest/sdk/register-root-component) instead of `AppRegistry.registerComponent`:

```diff
+ import {registerRootComponent} from 'expo';

- import {AppRegistry} from 'react-native';
import App from './App';
- import {name as appName} from './app.json';

- AppRegistry.registerComponent(appName, () => App);
+ registerRootComponent(App);
```

> Learn more about [`registerRootComponent`](/versions/latest/sdk/register-root-component/#registerrootcomponentcomponent).

## Prebuild

> **warning** Make sure you have committed your changes in case you want to revert, the command will warn you about this too!

If you're migrating an existing project, then you may want to refer to [**migrating native customizations**](#migrate-native-customizations) first.

Run the following command to regenerate the **android** and **ios** directories based on the app config (**app.json/app.config.js**) configuration:

<Terminal cmd={['$ npx expo prebuild --clean']} cmdCopy="npx expo prebuild --clean" />

You can test that everything worked by building the projects locally:

<Terminal
  cmd={[
    '# Build your native Android project',
    '$ npx expo run:android',
    '',
    '# Build your native iOS project',
    '$ npx expo run:ios',
  ]}
/>

> Learn more about [compiling native apps](/more/expo-cli/#compiling).

## Extra changes

The following changes are optional but recommended.

**.gitignore**

You can add **.expo** to your **.gitignore** to prevent generated values from Expo CLI from being committed. These [values are unique to your project](/more/expo-cli/#expo-directory) on your local computer.

You can also add **android** and **ios** to the **.gitignore** if you want to ensure they are not committed between prebuilds.

**app.json**

Remove all fields that are outside the top-level `expo` object as these will not be used in `npx expo prebuild`.

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

See [Customizing Metro](/guides/customizing-metro/).

**package.json**

You may want to change the scripts to use the [Expo CLI](/more/expo-cli/#compiling) run commands:

```diff
  "scripts": {
    "start": "expo start",
-    "android": "react-native run-android",
-    "ios": "react-native run-ios",
+    "android": "expo run:android",
+    "ios": "expo run:ios",
  },
```

These commands have better logging, auto code signing, better simulator handling, and they ensure you run `npx expo start` to serve files.

## Migrate native customizations

If your project has any native modifications (changes to the **android** or **ios** directories, such as app icon configuration or splash screen) then you'll need to configure your app config (**app.json**) to reflect those native changes.

- Check to see if your changes overlap with the built-in [app config fields](/versions/latest/config/app/). For example, if you have an app icon, be sure to define it as `expo.icon` in the **app.json** then re-run `npx expo prebuild`.
- Look up if any of the packages you are using require an [Expo config plugin][config-plugins]. If a package in your project requires additional changes inside the **android** or **ios** directories, then you will probably need a Config Plugin. Some plugins can be automatically added by running `npx expo install` with all of the packages in your **package.json** dependencies. If a package requires a plugin but doesn't supply one, then you can try checking the community plugins at [`expo/config-plugins`](https://github.com/expo/config-plugins) to see if one already exists.
- You can use the [VS Code Expo extension][vs-code-expo] to introspect your changes and debug if prebuild is generating the native code you expect. Just press <kbd>Cmd ⌘</kbd> + <kbd>Shift</kbd> + <kbd>p</kbd>, type "Expo: Preview Modifier", and select the native file you wish to introspect.
- Additionally, you can develop local config plugins to fit your needs. [Learn more](/config-plugins/development-and-debugging/#develop-a-plugin).

## Add more features

Prebuild is the tip of the automation iceberg, here are some features you can adopt next:

- [EAS Build](/build/setup): Code signing and cloud building.
- [EAS Update](/build/updates): Send over-the-air updates instantly.
- [Expo for web](/workflow/web): Run your app in the browser.
- [Expo Dev Client][dev-client]: Create your own personal "Expo Go" type app around your native runtime.
- [Expo native module API][expo-modules-core]: Write modules with Swift and Kotlin. This is automatically supported when using `npx expo prebuild`.

[vs-code-expo]: https://marketplace.visualstudio.com/items?itemName=expo.vscode-expo-tools
[expo-modules-core]: /modules/module-api/
[dev-client]: /develop/development-builds/introduction/
[config-plugins]: /config-plugins/introduction/
[prebuild]: /workflow/prebuild
[cli]: /more/expo-cli/
