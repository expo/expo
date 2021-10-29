---
title: Adding custom native code
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

The Expo Go app enables you to move quickly by building on a feature rich native runtime that is well suited for developing many types of apps. If you want to use custom native code that isn't already in the Expo Go app, you will need to generate the native iOS and Android projects that are typically hidden in the managed workflow, then build and run them.

You can do this in a single command on each platform:

<TerminalBlock cmd={['# Build your native iOS project', 'expo run:ios', '', '# Build your native Android project', 'expo run:android']} />

> Run commands were introduced in SDK 41, prebuilding and running in earlier SDKs may not work as well.

<!-- TODO: Add a doctor command bootstrap easier -->
<!-- TODO: Don't link outside of Expo docs -->

- `expo run:ios` requires Xcode (macOS only) installed on your computer. See the [setup guide](https://reactnative.dev/docs/environment-setup)
- `expo run:android` requires Android Studio and the Android SDK to be installed. See the [setup guide](https://reactnative.dev/docs/environment-setup)

<!-- TODO: Link to run commands doc -->
<!-- TODO: Link to prebuild commands doc -->

Using the run commands will initially [prebuild](https://expo.fyi/prebuilding) your project to generate all of the native code within your project directory. If you manually modify the `ios/` or `android/` folders, you won't be able to safely re-run `expo prebuild`, this is known as the [bare workflow](../introduction/managed-vs-bare.md#bare-workflow).

Your app can still run in Expo Go, but any custom native code won't be accessible if it's not already present in the Expo Go app. [Learn more](./using-expo-client).

If you install a package with a Expo [**config plugin**](../guides/config-plugins), you'll need to add the plugin to your **app.json**s [`plugins`](../versions/latest/config/app/#plugins) array, then re-run `expo prebuild` to sync the changes before rebuilding the native app. Often this does things like adding required permissions to the **Info.plist** or **AndroidManifest.xml**. You may need to run `expo prebuild --clean` depending on how complex the plugin is; this will delete and re-generate the native project files from scratch.

## Manually changing the native project files

If you've made manual modifications to your `ios/` or `android/` folder, you'll need to manually setup new packages because running `expo prebuild` may not work as expected with an unpredictable project state (think of this like running `yarn` after manually modifying your `node_modules/` folder).

If you want to make static changes to your native project files like the iOS **Info.plist**, or **AndroidManifest.xml** and still have access to prebuilding, check out the [config plugins guide](../guides/config-plugins/#creating-a-plugin) to see how you can hook into the prebuild process to make those changes.

## Reverting changes from `expo run`

If you've decided that you want to roll your app back to being fully managed (no iOS and Android projects in your project directory), you can checkout your most recent commit before executing `expo run:[ios|android]`, then run `npm install` again to restore the state of your **node_modules** directory.

## Developing apps with custom native code

Once you have customized the native code in your project, you can use the [`expo-dev-client`](/clients/introduction.md) package to create a custom development client and retain the convenience of working with just JavaScript and/or TypeScript in Expo Go. You can create a custom client for your managed or bare workflow by following [our guide](/clients/getting-started.md).

## Releasing apps with custom native code to production

The classic `expo build` command does not support custom native code. When you're ready to ship your app, you can [build it with EAS Build](/build/introduction.md) or archive and sign it locally.

<TerminalBlock cmd={['# Install the CLI', 'npm i -g eas-cli', '', '# Build your app!', 'eas build -p all']} />