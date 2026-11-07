# Brownfield Tester — Isolated

These are standalone native Android and iOS apps that consume **pre-built brownfield artifacts** (Maven local repository for Android, xcframeworks via Swift Package for iOS). They do not use Expo autolinking or depend on the monorepo's `node_modules` at build time — they are fully self-contained.

This is the recommended approach for distributing brownfield integrations to existing native apps.

## Prerequisites

Before building these apps, you need to generate the brownfield artifacts from the `expo-app`:

```sh
cd ../expo-app

# Android — builds and publishes to MavenLocal
npx expo prebuild --clean -p android
npx expo-brownfield build:android --repo MavenLocal --all --verbose

# iOS — builds xcframeworks
npx expo prebuild --clean -p ios
npx expo-brownfield build:ios --release --verbose
npx expo-brownfield build:ios --debug --verbose
```

See the [expo-app README](../expo-app/README.md) for more details on building artifacts.

## Android

Once artifacts are published to Maven Local, open the `android/` project in Android Studio and build normally. The app resolves the brownfield libraries from `mavenLocal()`.

## iOS

After building xcframeworks, the `add_xcframeworks.rb` script (in the E2E scripts) adds the Swift Package containing the frameworks to the Xcode project. You can also add them manually via Xcode's "Add Package Dependencies" with a local package path.

### SwiftUI scene smoke test

The iOS app owns an `ExpoHost` and shares it with both the new `ExpoScene` views and the existing brownfield views. The default host loads the embedded bundle in Debug and Release.

1. Build and launch the Debug app with Metro stopped. Dismiss the development menu if it opens. Confirm the custom React Native component renders.
2. Open **Expo scenes**. Confirm **First**, **Second**, and **Summary** display the same runtime identifier.
3. Increment **First**. Confirm **Second** keeps its own local count.
4. Change the native stepper. Confirm all three scenes receive the new value and **First** keeps its local count.
5. Increment **Second**, then turn **Show second counter** off and on. Confirm **Second** starts at zero while **First** keeps its count and the runtime identifier stays the same.
6. Navigate back and reopen the screen. Confirm local counts reset and the runtime identifier stays the same.

Also check the existing React Native screen, native dismissal, and shared-state screen after changing the host. For live JavaScript development, create the host with `.developmentServer` in Debug and run Metro.
