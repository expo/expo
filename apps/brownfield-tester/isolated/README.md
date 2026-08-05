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
