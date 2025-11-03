# Brownfield Tester App

This is a sample application used to test brownfield integration with Expo modules.
It uses the "integrated" approach to load JS code of the `minimal-tester` app by configuring a custom project root.

## Android App

The Android app was initialized by creating a new Empty Activity project in Android Studio 2025.1.3 and following the [Brownfield Integration](https://docs.expo.dev/brownfield/get-started/) guide to integrate Expo modules. As a final step, due to the React Native targeting Java 17 we removed the default `compileOptions` from `app/build.gradle.kts` and removed `dependencyResolutionManagement` `repositoriesMode` from `settings.gradle.kts` because the `react-native` plugin configures the maven repo.

## iOS App

The iOS app was initialized by creating a new SwiftUI project in Xcode 26 and following the [Brownfield Integration](https://docs.expo.dev/brownfield/get-started/) guide to integrate Expo modules. As a final step, due to Swift 6 not being totally supported yet it was necessary to set "Default Actor isolation" to "nonisolated" in the project settings.
