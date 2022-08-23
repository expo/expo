---
title: Adding custom native code
---

import { Terminal } from '~/ui/components/Snippet';

The Expo Go app is a great tool to get started — it exists to help developers quickly get projects off the ground, to experiment with ideas (such as on [Snack](https://snack.expo.dev/)) and share their work with minimal friction. Expo Go makes this possible by including a feature-rich native runtime made up of every module in the [Expo SDK](/versions/latest/), so all you need to do to use a module is install the package and reload your app.

The tradeoff is that Expo Go does not allow you to add custom native code, you can only use native modules built into the Expo SDK. There are many great libraries available outside of the Expo SDK, and you may even want to build your own native library. You can leverage these libraries with "development builds", or by using prebuild to generate the native projects, or both. You can also continue using [EAS Build](/build/introduction) to release your app, no changes are required.

## Adding custom native code with development builds

To make use of third party libraries with custom native code and continue with the same developer experience of Expo Go, you can migrate to using ["development builds"](/development/introduction). Development builds are like your own personal version of Expo Go — they include the native runtime that powers your app, and you control what is included in that native runtime by adding or removing packages in your **package.json**. Development builds allow you to continue to build your app in JavaScript while taking advantage of the full ecosystem of native packages available for Expo and React Native projects.

Learn how to start using custom native code in your app by switching from Expo Go to development builds in the ["Getting Started" guide for development builds](/development/getting-started).

## Generate native projects with prebuild

If you would like to move from a JavaScript based project and take ownership over the iOS and Android native projects, you can generate them by running `npx expo prebuild`, or `npx expo run:[ios|android]` (which will run `prebuild` automatically). You can also use development builds in this context - the easiest way to do this is to run `npx expo install expo-dev-client` prior to `prebuild` or `run`, and it's also possible to add the library at any later time ([learn more](/development/installation)).

<Terminal cmd={[
  '# Build your native Android project',
  '$ npx expo run:android',
  '',
  '# Build your native iOS project',
  '$ npx expo run:ios'
]} cmdCopy="npx expo run:android && npx expo run:ios" />

- `expo run:ios` requires Xcode (macOS only) installed on your computer. See the [setup guide](https://reactnative.dev/docs/environment-setup).
- `expo run:android` requires Android Studio and the Android SDK to be installed. See the [setup guide](https://reactnative.dev/docs/environment-setup).

Using the run commands will initially [prebuild](https://expo.fyi/prebuilding) your project to generate all of the native code within your project directory. If you manually modify the `ios/` or `android/` folders, you won't be able to safely re-run `expo prebuild`, this is known as the [bare workflow](/introduction/managed-vs-bare#bare-workflow).

Your app can still run in Expo Go, but any custom native code won't be accessible if it's not already present in the Expo Go app. [Learn more](/bare/using-expo-client).

If you install a package with an Expo [**config plugin**](/guides/config-plugins), you'll need to add the plugin to the [`plugins`](/versions/latest/config/app/#plugins) array in the project's **app.json**, then re-run `expo prebuild` to sync the changes before rebuilding the native app. Often this does things like adding required permissions to the **Info.plist** or **AndroidManifest.xml**. You may need to run `expo prebuild --clean` depending on how complex the plugin is; this will delete and re-generate the native project files from scratch.

### Manually changing the native project files

If you've made manual modifications to your `ios/` or `android/` folder, you'll need to manually setup new packages because running `expo prebuild` may not work as expected with an unpredictable project state (think of this like running `yarn` after manually modifying your `node_modules/` folder).

If you want to make static changes to your native project files like the iOS **Info.plist**, or **AndroidManifest.xml** and still have access to prebuilding, check out the [config plugins guide](/guides/config-plugins/#creating-a-plugin) to see how you can hook into the prebuild process to make those changes.

### Reverting changes from `expo run`

If you've decided that you want to roll your app back to being fully managed (no iOS and Android projects in your project directory), you can checkout your most recent commit before executing `expo run:[ios|android]`, then run `npm install` again to restore the state of your **node_modules** directory.

### Developing apps with custom native code

Once you have customized the native code in your project, you can use the [`expo-dev-client`](/development/introduction) package to create a development build and retain the convenience of working with just JavaScript and/or TypeScript in Expo Go. You can create a development build for your managed or bare workflow by following [our guide](/development/getting-started).

## Releasing apps with custom native code to production

When you're ready to ship your app, you can [build it with EAS Build](/build/introduction) exactly the same as you were building it before adding custom native code. Alternatively, you can archive and sign it locally. Unsurprisingly, we recommend EAS Build!

<Terminal cmd={[
  '# Install the CLI',
  '$ npm i -g eas-cli',
  '',
  '# Build your app!',
  '$ eas build -p all'
]} cmdCopy="npm i -g eas-cli && eas build -p all" />
