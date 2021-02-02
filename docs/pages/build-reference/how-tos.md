---
title: Integrating with JavaScript tooling
---

This document outlines how to configure EAS Build for some common scenarios, such as monorepos and repositories with private dependencies. The examples described here do not provide step-by-step instructions to set up EAS Build from scratch. Instead, they explain the changes from the standard process that are necessary to acommodate the given scenario.

## EAS Build-specific npm hooks

There are three EAS Build-specific npm hooks that you can set in your package.json. See the [Android build process](android-builds.md) and [iOS build process](ios-builds.md) docs to get a better understanding about the internals of the build process.

- `eas-build-pre-install` - executed before EAS Build runs `yarn install`
- `eas-build-post-install` - the behavior depends on the platform:
  - for Android, after `yarn install` has completed
  - for iOS, after `yarn install` and `pod install` have completed
- `eas-build-pre-upload-artifacts` - this hook is triggered almost at the end of the build process, just before EAS Build uploads the build artifacts to AWS S3

This is an example of how your package.json might look like:

```json
{
  "main": "index.js",
  "scripts": {
    "eas-build-pre-install": "echo 123",
    "eas-build-post-install": "echo 456",
    "eas-build-pre-upload-artifacts": "echo 789",
    "android": "react-native run-android",
    "ios": "react-native run-ios",
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

## How to set up EAS Build with a monorepo

- Run all EAS CLI commands from the root of the app directory. For example: if your project exists inside of your git repository at `apps/my-app`, then run `eas build` from there.
- All files related to EAS Build, such as `eas.json` and `credentials.json`, should be in the root of the app directory. If you have multiple apps that use EAS Build in your monorepo, each app directory will have its own copy of these files.
- If your project needs additional setup beyond what is provided, add a `postinstall` step to `package.json` in your project that builds all necessary dependecies in other workspaces. For example:

```json
{
  "scripts": {
    "postinstall": "cd ../.. && yarn build"
  }
}
```

## How to use private package repositories

- Configure your project in a way that works with `yarn` and relies on the `NPM_TOKEN` env variable to authenticate with private repositories
- add `experimental.npmToken` in `credentials.json`

```json
{
  "experimental": {
    "npmToken": "example npm token"
  }
}
```

If you are not using `credentials.json` for Android/iOS credentials, it is fine for `experimental.npmToken` to be the only entry in the file. Add `credentials.json` to `.gitignore` if it's not there already.
