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

## Using npm cache with yarn v1

By default the EAS npm cache won't work with yarn v1, because `yarn.lock` files contain URLs to registries for every package and yarn does not provide any way to override it. The issue is fixed in yarn v2, but the yarn team does not plan to backport it to yarn v1. If you want to take advantage of the npm cache, you can use the `eas-build-pre-install` script to override the registry in your `yarn.lock`.

e.g.
```
{
 "scripts": {
    "eas-build-pre-install": "bash -c \"[ ! -z \\\"NPM_CACHE_URL\\\" ] && sed -i -e \\\"s#https://registry.yarnpkg.com#$NPM_CACHE_URL#g\\\" yarn.lock\""
  }
}
```

## Maintaining generic project with multiple bundle identifiers

It's common to have multiple schemes with unique bundle identifiers in iOS projects in order to have development and production versions of your app on one phone at the same time. The current implementations of `eas build` and `eas build:configure` assume that the native project can only have one bundle identifier, so as a temporary workaround we added `experimental.disableIosBundleIdentifierValidation`, to disable that validation in both commands. With that flag enabled, the value of the bundle identifier from `app.json`/`app.config.js` will take precedence, and you can use the `scheme` property in your `eas.json` to switch between build schemes.

```bash
# to build staging
APP_ENV=staging eas build --platform ios --profile staging

# to build production
APP_ENV=production eas build --platform ios --profile production
```

```js
// example app.config.js

const isStaging = process.env.APP_ENV === "staging";
const bundleIdentifier = isStaging
  ? "xyz.easbuildapp.staging"
  : "xyz.easbuildapp";

export default ({ config }) => ({
  expo: {
    ...config,
    ios: {
      bundleIdentifier,
    },
  },
});

```

```json
// example eas.json

{
  "experimental": {
    "disableIosBundleIdentifierValidation": true
  },
  "build": {
    "ios": {
      "staging": {
        "worflow": "generic",
        "scheme": "myapp-staging",
        "env": {
            "APP_ENV": "staging"
        }
      },
      "production": {
        "worflow": "generic",
        "scheme": "myapp",
        "env": {
            "APP_ENV": "production"
        }
      }
    }
  }
}
```
