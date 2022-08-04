---
title: EAS Build hooks
---

There are five EAS Build-specific npm hooks that you can set in your **package.json**. See the [Android build process](android-builds.md) and [iOS build process](ios-builds.md) docs to get a better understanding about the internals of the build process.

- `eas-build-pre-install` - executed before EAS Build runs `yarn install`.
- `eas-build-post-install` - the behavior depends on the platform and project type:
  - Android
    - managed projects - runs after `yarn install` and `expo prebuild`.
    - bare projects - runs after `yarn install`.
  - iOS - runs after `yarn install` and `pod install`.
- `eas-build-on-success` - this hook is triggered at the end of the build process if the build was successful.
- `eas-build-on-error` - this hook is triggered at the end of the build process if the build failed.
- `eas-build-on-complete` - this hook is triggered at the end of the build process. You can check the build's status with the `EAS_BUILD_STATUS` environment variable. It's either `finished` or `errored`.

This is an example of how your **package.json** might look like:

```json
{
  "main": "index.js",
  "scripts": {
    "eas-build-pre-install": "echo 123",
    "eas-build-post-install": "echo 456",
    "eas-build-on-success": "echo 789",
    "eas-build-on-error": "echo 012",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "start": "react-native start",
    "test": "jest"
  },
  "dependencies": {
    "expo": "~40.0.0"
    // ...
  },
  "devDependencies": {
    // ...
  },
  "jest": {
    "preset": "react-native"
  },
  "private": true
}
```
