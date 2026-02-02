# Expo Brownfield Test App

This app is intended for testing `expo-brownfield` package and its integration with other packages like `expo-router`, `expo-updates` or `expo-dev-menu`.

It also serves as the base app for `expo-brownfield` E2E tests.

## Metro

To use the app with Metro Bundler in debug make sure to run `yarn start` in the app directory and to use artifacts build in `Debug` or `All` build types (only supported for Android).

## Building

The simplest way to ship the app as a reusable brownfield artifacts is to use `expo-brownfield` built-in CLI:

```sh
# Android
npx expo-brownfield build:android --repo MavenLocal --all --verbose

# iOS
npx expo-brownfield build:ios --release --verbose
npx expo-brownfield build:ios --debug --verbose
```
