---
title: Already used React Native?
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';
import { Terminal } from '~/ui/components/Snippet';

This guide is intended to give developers who have already used React Native a quick outline on some of the benefits of using Expo tools and services to build React Native apps. Expo's offering is very flexible, you can mix and match tools as needed to prevent lock-in.

## Deployment

Arguably the most frustrating part of app development is deploying to the app stores. EAS is the easiest way to build native, submit, and update native apps.

<Terminal cmd={[
'# Install the CLI',
'$ npm i -g eas-cli',
'',
'# Build and submit your app!',
'$ eas build --auto-submit'
]} cmdCopy="npm i -g eas-cli && eas build --auto-submit" />

You can run `eas build --auto-submit` using EAS CLI to both build your app and automatically upload the binary for distribution on the Apple App Store and Google Play Store.

This automatically manages **all native codesigning** for iOS and Android for any React Native app. Advanced features like payments, notifications, universal links, iCloud, etc can be automatically enabled based on the libraries in your `package.json`, meaning no more wrestling with slow portals to get libraries setup correctly.

EAS builds and submits from a remote device meaning you can kick-off from any device. Unlike other native CI tools, EAS Build is designed for React Native meaning smart memoization (caching) is already optimized for your project by default.

> Have company policies or restrictions preventing you from using third-party services? EAS Build can be run [locally or on your own infrastructure](/build-reference/local-builds/)!

## Libraries

Expo provides a suite of well-tested, consistent, and increasingly comprehensive React Native modules that give you access to the underlying native APIs on iOS, Android, and web. These packages make up the **Expo SDK**. All of the packages are written in TypeScript, versioned together, and can be used in any React Native app. [Learn more](../bare/hello-world.md).

## Expo CLI

The `expo` package provides a small but powerful CLI tool `npx expo` which prioritizes iteration speed and error resilience. `npx expo start` provides multiple ways to connect to the local dev server including tunneling with [ngrok](https://ngrok.com) for connecting stubborn devices to even more stubborn Wi-Fi networks.

The native build commands `npx expo run:ios` and `npx expo run:android` provide auto development codesigning and error streaming meaning you only need to open Xcode and Android Studio if you _want_ to and not because you _have_ to. The run commands also provide quality of life improvements like smart log parsing to only show you warnings and errors from your project, unlike Xcode which surfaces hundreds of benign warnings from your node modules.

Spend less time wrestling with versioning by using the `npx expo install` command which installs known npm packages that work with the version of `expo`/`react-native` in your project.

> `npx expo` can be used with `npx react-native` simultaneously.

## Prebuild

> Prebuild was formally referred to as the managed workflow.

Expo CLI provides a unique and powerful system called [_prebuild_](/workflow/prebuild.md), which intelligently generates the native `ios` and `android` directories for your project continuously. Meaning **ridiculously easy React Native upgrades at scale**, fewer native errors, and less blind copy/paste to get packages working. Prebuild is the missing link for cross-platform development, learn more about why you should use it in the [prebuild pitch](/workflow/prebuild#pitch).

## Over-the-air Updates

If you've ever been in a situation where you find a spelling mistake in your app and have to wait for Apple to approve a change, you'll appreciate updates - these changes will appear as soon as you run `eas update`. You aren't limited to text either, this applies to assets like images and configuration updates too! OTA Updates are the main reason that React Native is the best way to create a native app, and [EAS Update](/eas-update/introduction) is the most powerful way to send updates, serving hundreds of millions of end users around the world every day!

## Expo Go

You can share your app with anyone on your team, anywhere in the world while with the [Expo Go](https://expo.dev/expo-go) app [(available on the App / Play Store)](https://expo.dev). Expo Go is a reusable client app for React Native that contains many popular React Native libraries and the Expo SDK, meaning you can go from zero to native without any native code in your project. Expo Go is indispensible for fast moving and remote teams.

## Notifications

One of the leading reasons to build a native app as opposed to a website is mobile notification support. Expo provides a Notification service making it easier than ever to instantly send native notifications to your users. You can try it right [from the browser](https://expo.dev/notifications).

## TypeScript

Expo has first-class TypeScript support, to get started simply run `touch tsconfig.json && npx expo` to automatically configure sensible TypeScript defaults for your app. All Expo packages and tools are written in TypeScript to ensure a solid developer experience.

## Web Support

All of the packages in the Expo SDK have web support (SPA, SSR, SSG supported) where possible. The `npx expo start` can host your app performantly in the browser using React Native for Web -- the technology used to power https://twitter.com.

Web support in Expo is surprisingly practical and very flexible, you can even integrate with popular web frameworks like Next.js, Storybook, Gatsby, Electron and more.

## Helpful Tools & Resources

- [snack.expo.dev](https://snack.expo.dev): The best way to test and share examples and small projects directly from your browser. Point your phone at the QR code and you have a sandbox environment you can build in the browser and test directly on your device.
- [forums.expo.dev](https://forums.expo.dev): The fastest way to get help from the Expo team or community
- [github.com/expo](https://github.com/expo): Source code for most of Expo's offering. If there's something you'd like to fix, or figure out how we implement our native modules, you're welcome to look through the code yourself!

## Migrating from React Native CLI

| Purpose                    | Before                         | After                  |
| -------------------------- | ------------------------------ | ---------------------- |
| Create a project           | `npx react-native init`        | `npx create-expo-app`  |
| Start a dev server         | `npx react-native start`       | `npx expo start`       |
| Compile for iOS            | `npx react-native run-ios`     | `npx expo run:ios`     |
| Compile for Android        | `npx react-native run-android` | `npx expo run:android` |
| Export static JS bundle    | `npx react-native bundle`      | `npx expo export`      |
| View the config            | `npx react-native config`      | `npx expo config`      |
| Diagnose the project       | `npx react-native info`        | `npx expo-env-info`    |
| Generate native projects   | N/A                            | `npx expo prebuild`    |
| Install versioned packages | N/A                            | `npx expo install`     |
| Build and codesign an app  | N/A                            | `eas build`            |
| Submit binaries to stores  | N/A                            | `eas submit`           |
| Publish OTA updates        | N/A                            | `eas update`           |
| Upload app store metadata  | N/A                            | `eas metadata`         |

Commands like `npx react-native doctor` can be used in any project context. Learn more about [Expo CLI](/workflow/expo-cli) and [EAS CLI](/eas/).
