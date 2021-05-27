---
title: Adding custom native code
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

The Expo Go app enables us to move quickly by shipping a reusable native runtime for developing apps. If you want to use custom native code that isn't already in the Expo Go app, you will need to build a new native app.

You can do this in a single command:

<TerminalBlock cmd={['# Build your native iOS project', 'expo run:ios', '# Build your native Android project', 'expo run:android']} />

<!-- TODO: Add a doctor command bootstrap easier -->
<!-- TODO: Don't link outside of Expo docs -->

- `expo run:ios` requires Xcode (macOS only) installed on your computer. See the [setup guide](https://reactnative.dev/docs/environment-setup)

<!-- TODO: Add a doctor command bootstrap easier -->
<!-- TODO: Don't link outside of Expo docs -->

- `expo run:android` requires Android Studio and the Android SDK to be installed. See the [setup guide](https://reactnative.dev/docs/environment-setup)

> Run commands were introduced in SDK 41, prebuilding and running in earlier SDKs may not work as well.

<!-- TODO: Link to run commands doc -->
<!-- TODO: Link to prebuild commands doc -->

Using the run commands will initially [prebuild](https://expo.fyi/prebuilding) your project to generate all of the native code within your project directory. If you manually modify the `ios/` or `android/` folders, you won't be able to safely re-run `expo prebuild`, this is known as the [bare workflow](../introduction/managed-vs-bare.md#bare-workflow).

Your app can still run in Expo Go, but any custom native code won't be accessible if it's not already present in the Expo Go app. [Learn more](./using-expo-client).

If you install a package with a Expo [**config plugin**](../guides/config-plugins), you'll need to add the plugin to your `app.json`s [`plugins`](../versions/latest/config/app/#plugins) array, then re-run `expo prebuild` to sync the changes before rebuilding the native app. Often this does things like adding required permissions to the `Info.plist` or `AndroidManifest.xml`.

You may need to run `expo prebuild --clean` depending on how complex the plugin is. If you've made manual modifications to your `ios/` or `android/` folder, you'll need to manually setup new packages as running `expo prebuild` may not work as expected (think of this like running `yarn` after manually modifying your `node_modules/` folder).

If you want to make static changes to your native project files like the iOS `Info.plist`, or `AndroidManifest.xml` and still have access to prebuilding, check out the [config plugins guide](../guides/config-plugins/#creating-a-plugin)

# Production

When you're ready to ship your app, you can build it with EAS Build!

<TerminalBlock cmd={['# Install the CLI', 'npm i -g eas-cli', '# Build your app!', 'eas build']} />

> The legacy `expo build` command does not support custom native code.
