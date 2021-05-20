---
title: Using custom native code
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

The Expo Go app enables us to move quickly by shipping a reusable native runtime for developing apps. If you want to use custom native code that isn't already in the Expo Go app, you will need to build a new native app.

You can do this in a single command:

<TerminalBlock cmd={['# Build your native iOS project', 'expo run:ios', '# Build your native Android project', 'expo run:android']} />

<!-- TODO: Add a doctor command bootstrap easier -->
<!-- TODO: Don't link outside of Expo docs -->

> `expo run:ios` requires Xcode (Macos only) installed on your computer. See the [setup guide](https://reactnative.dev/docs/environment-setup)

<!-- TODO: Add a doctor command bootstrap easier -->
<!-- TODO: Don't link outside of Expo docs -->

> `expo run:android` requires Android Studio setup on your computer. See the [setup guide](https://reactnative.dev/docs/environment-setup)

> Run commands were introduced in SDK 41, prebuilding and running in earlier SDKs may not work as well.

<!-- TODO: Link to run commands doc -->
<!-- TODO: Link to prebuild commands doc -->

Using the run commands will initially [prebuild](https://expo.fyi/prebuilding) your project to generate all of the native code. If you manually modify the `ios/` or `android/` folders, you won't be able to safely re-run `expo prebuild`, this is known as the [bare workflow](../introduction/managed-vs-bare.md#bare-workflow).

Your app can still run in Expo Go, but any custom native code won't be accessible if it's not already present in the Expo Go app. [Learn more](./using-expo-client).

To eject to the bare workflow, you can run `expo eject` and follow the instructions. Head over to the [bare workflow walkthrough](../bare/exploring-bare-workflow.md) to learn more about what the workflow will look like after ejecting.

If you want to make static changes to your native project files like the iOS `Info.plist`, or `AndroidManifest.xml` and still have access to prebuilding, check out the [config plugins guide](../guides/config-plugins)
