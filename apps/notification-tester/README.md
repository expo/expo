# Notification Tester

The app for testing and developing the expo-notifications package.

It does require a bit of setup for push notifications to work - see https://docs.expo.dev/push-notifications/fcm-credentials/ plus a developer account for iOS.

Otherwise, it's a standard Expo + Expo router app that uses prebuild.

The goal is to be able to develop the package in the `expo` monorepo and easily test the changes through this app.


### Android

For debugging background behavior, you can use:

`adb shell am set-debug-app -w --persistent "com.brents.microfoam"`
