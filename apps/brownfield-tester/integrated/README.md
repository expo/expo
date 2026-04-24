# Brownfield Tester — Integrated

These are native Android and iOS apps that integrate directly with the Expo monorepo using **Expo autolinking**. They point their build/project root to `../expo-app`, which means React Native modules are resolved and linked at build time from the monorepo's `node_modules`.

> [!WARNING]
> This app redirects its build and project root to `../expo-app`. This should not be done and is an invalid project setup, that needs to be refactored. Please don't replicate this to other tests or E2E setups.

## Android

The Android app was initialized by creating a new Empty Activity project in Android Studio 2025.1.3 and following the [Brownfield Integration](https://docs.expo.dev/brownfield/get-started/) guide to integrate Expo modules. As a final step, due to the React Native targeting Java 17 we removed the default `compileOptions` from `app/build.gradle.kts` and removed `dependencyResolutionManagement` `repositoriesMode` from `settings.gradle.kts` because the `react-native` plugin configures the maven repo.

## iOS

The iOS app was initialized by creating a new SwiftUI project in Xcode 26 and following the [Brownfield Integration](https://docs.expo.dev/brownfield/get-started/) guide to integrate Expo modules. As a final step, due to Swift 6 not being totally supported yet it was necessary to set "Default Actor isolation" to "nonisolated" in the project settings.
