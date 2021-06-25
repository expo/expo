---
title: Configuration with eas.json
---

`eas.json` is your go-to place for configuring EAS Build. It is located at the root of your project next to your `package.json`. It looks something like this:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic"
      }
    }
  }
}
```

The JSON object under the `builds` key contains the platforms that you want to build for. The example above declares that you want to build app binaries for both Android and iOS platforms.

Each object under the platform key can contain multiple build profiles. Every build profile can have an arbitrary name. The default profile that is expected by EAS CLI to exist is `release` (if you'd like to build your app using another build profile you need to specify it with a parameter - `eas build --platform android --profile foobar`). In the example, there are two build profiles (one for Android and one for iOS) and they are both named `release`. However, they could be named `foo` or `bar` or whatever you'd like.

Generally, the schema of this file looks like this:

<!-- prettier-ignore -->
```json
{
  "builds": {
    /* @info valid values: android, ios */"PLATFORM_NAME"/* @end */: {
      /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_1"/* @end */: { ... },
      /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_2"/* @end */: { ... },
      ...,
    },
    ...
  }
}
```

where `PLATFORM_NAME` is one of `android` or `ios`.

## Build Profiles

There are two types of build profiles: generic and managed.

**Generic projects** make almost no assumptions about your project's structure. The only requirement is that your project follows the general structure of React Native projects. This means there are `android` and `ios` directories in the root directory with the Gradle and Xcode projects, respectively. Whether you've initialized your project with `expo init --template bare-minimum` or with `npx react-native init`, you can build it with EAS Build.

**Managed projects** are much simpler in terms of the project's structure and the knowledge needed to start developing your application. Those projects don't have the native code in the repository and they are tightly coupled with Expo. Basically, by managed projects, we mean projects initialized with `expo init` using a managed workflow template (like `blank`, `blank-typescript`, or `tabs`).

## Android

### Generic project

The schema of a build profile for a generic Android project looks like this:

```json
{
  "workflow": "generic",
  "extends": string,
  "credentialsSource": "local" | "remote", // default: "remote"
  "withoutCredentials": boolean, // default: false
  "gradleCommand": string, // default: ":app:bundleRelease"
  "artifactPath": string, // default: "android/app/build/outputs/**/*.{apk,aab}"
  "releaseChannel": string, // default: "default"
  "distribution": "store" | "internal", // default: "store"
  "image": string, // default: "default"
  "node": string,
  "yarn": string,
  "ndk": string,
  "env": Record<string, string>,
  "cache": {
    "disabled": boolean, // default: false
    "key": string,
    "customPaths": string[] // default: []
  }
}
```

- `"workflow": "generic"` indicates that your project is a generic one.
- `extends` allows extending values from another build profile.
- `credentialsSource` defines the source of credentials for this build profile. If you want to provide your own `credentials.json` file, set this to `local` ([learn more on this here](/app-signing/local-credentials.md)). If you want to use the credentials managed by EAS, choose `remote` (this is the default option).
- `withoutCredentials`: when set to `true`, EAS CLI won't require you to configure credentials when building the app using this profile. This comes in handy when you want to build debug binaries and the debug keystore is checked in to the repository. The default is `false`.
- `gradleCommand` defines the Gradle task to be run on EAS servers to build your project. You can set it to any valid Gradle task, e.g. `:app:assembleDebug` to build a debug binary. The default Gradle command is `:app:bundleRelease`.
- `artifactPath` is the path (or pattern) where EAS Build is going to look for the build artifacts. EAS Build uses the `fast-glob` npm package for pattern matching ([see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax)). The default value is `android/app/build/outputs/**/*.{apk,aab}`.
- `releaseChannel` is the release channel for the `expo-updates` package ([Learn more about this](../distribution/release-channels.md)). If you do not specify a channel, your binary will pull releases from the `default` channel. If you do not use `expo-updates` in your project then this property will have no effect.
- `distribution` is the flow of distributing your app. If you choose `internal` you'll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. When using `internal`, make sure the `gradleCommand` produces an APK file (e.g. `:app:assembleRelease`). Otherwise, the sharable URL will be useless. The default is `store` which means your build URLs won't be sharable. [Learn more about internal distribution](internal-distribution.md).
- `image` - image with build environment. [Learn more about it here](../build-reference/infrastructure).
- `node` - version of Node.js
- `yarn` - version of Yarn
- `ndk` - version of Android NDK
- `env` - environment variables that should be set during the build process (should only be used for values that you would commit to your git repository, i.e. not passwords or secrets).
- `cache` configures paths that will be saved and restored in the next build. The cache can be explicitly invalidated by updating the value of the `key` field. Values in `customPaths` support both absolute and relative paths, where relative paths are resolved from the directory with `eas.json`. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn't work well for `node_modules` because the cache is not local to the machine, so a download speed is similar to downloading from the npm registry. Set `"disabled": true` to disable caching.

#### Examples

This is the minimal working example. EAS CLI will ask you for the app's credentials, the project will be built with the `./gradlew :app:bundleRelease` command, and you'll be provided with the URL to the `android/app/build/outputs/bundle/release/app-release.aab` file.

```json
{
  "workflow": "generic"
}
```

If you'd like to build a release APK, use this example:

```json
{
  "workflow": "generic",
  "gradleCommand": ":app:assembleRelease",
  "artifactPath": "android/app/build/outputs/apk/release/app-release.apk"
}
```

If you'd like to build a debug APK use the following example. Also, make sure the debug keystore is checked in to the repository.

```json
{
  "workflow": "generic",
  "withoutCredentials": true,
  "gradleCommand": ":app:assembleDebug",
  "artifactPath": "android/app/build/outputs/apk/debug/app-debug.apk"
}
```

### Managed Project

The schema of a build profile for a managed Android project looks like this:

```json
{
  "workflow": "managed",
  "extends": string,
  "credentialsSource": "local" | "remote", // default: "remote"
  "buildType": "app-bundle" | "apk" | "development-client", // default: "app-bundle"
  "releaseChannel": string, // default: "default"
  "distribution": "store" | "internal", // default: "store"
  "image": string, // default: "default"
  "node": string,
  "yarn": string,
  "expoCli": string,
  "ndk": string,
  "env": Record<string, string>,
  "cache": {
    "disabled" : boolean, // default: false
    "key": string,
    "customPaths": string[] // default: []
  }
}
```

- `"workflow": "managed"` indicates that your project is a managed one.
- `extends` allows extending values from another build profile.
- `credentialsSource` defines the source of credentials for this build profile. If you want to provide your own `credentials.json` file, set this to `local` ([learn more on this here](/app-signing/local-credentials.md)). If you want to use the credentials managed by EAS, choose `remote` (this is the default option).
- `buildType` when set to `app-bundle` or `apk` it produces a release AAB or APK archive respectively, but when set to `development-client` it produces a debug APK.
- `releaseChannel` is the release channel for the `expo-updates` package ([Learn more about this](../distribution/release-channels.md)). If you do not specify a channel, your binary will pull releases from the `default` channel. If you do not use `expo-updates` in your project then this property will have no effect.
- `distribution` is the flow of distributing your app. If you choose `internal` you'll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. When `distribution` is `internal`, `buildType` needs to be set to `apk`. The default is `store` which means your build URLs won't be sharable. [Learn more about internal distribution](internal-distribution.md).
- `image` - image with build environment. [Learn more about it here](../build-reference/infrastructure).
- `node` - version of Node.js
- `yarn` - version of Yarn
- `expoCli` - version of [expo-cli](https://www.npmjs.com/package/expo-cli) used to [prebuild](../workflow/expo-cli/#expo-prebuild) your app
- `ndk` - version of Android NDK
- `env` - environment variables that should be set during the build process (should only be used for values that you would commit to your git repository, i.e. not passwords or secrets).
- `cache` configures paths that will be saved and restored in the next build. The cache can be explicitly invalidated by updating the value of the `key` field. Values in `customPaths` support both absolute and relative paths, where relative paths are resolved from the directory with `eas.json`. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn't work well for `node_modules` because the cache is not local to the machine, so a download speed is similar to downloading from the npm registry. Set `"disabled": true` to disable caching.

#### Examples

This is the minimal working example. EAS CLI will ask you for the app's credentials, an AAB file will be produced.

```json
{
  "workflow": "managed"
}
```

If you'd like to build a release APK instead, use the following example:

```json
{
  "workflow": "managed",
  "buildType": "apk"
}
```

## iOS

### Generic Project

The schema of a build profile for a generic iOS project looks like this:

```json
{
  "workflow": "generic",
  "extends": string,
  "credentialsSource": "local" | "remote", // default: "remote"
  "scheme": string,
  "schemeBuildConfiguration": string,
  "artifactPath": string, // default: "ios/build/App.ipa"
  "releaseChannel": string, // default: "default"
  "distribution": "store" | "internal" | "simulator", // default: "store"
  "enterpriseProvisioning": "adhoc" | "universal",
  "autoIncrement": boolean | "version" | "buildNumber", // default: false
  "image": string, // default: "default"
  "node": string,
  "yarn": string,
  "bundler": string,
  "fastlane": string,
  "cocoapods": string,
  "env": Record<string, string>,
  "cache": {
    "disabled" : boolean, // default: false
    "key": string,
    "cacheDefaultPaths": boolean, // default: true
    "customPaths": string[] // default: []
  }
}
```

- `"workflow": "generic"` indicates that your project is a generic one.
- `extends` allows extending values from another build profile.
- `credentialsSource` defines the source of credentials for this build profile. If you want to provide your own `credentials.json` file, set this to `local` ([learn more on this here](/app-signing/local-credentials.md)). If you want to use the credentials managed by EAS, choose `remote` (this is the default option).
- `scheme` defines the Xcode project's scheme to build. You should set it if your project has multiple schemes. Please note that if the project has only one scheme, it will automatically be detected. However, if multiple schemes exist and this value is **not** set, EAS CLI will prompt you to select one of them.
- `schemeBuildConfiguration` is the configuration to use when building the app. When set, the native project configuration is overridden with the corresponding value. If left unset, the value set in the scheme is used. For example, `"Debug"` or `"Release"` are common values.
- `artifactPath` is the path (or pattern) where EAS Build is going to look for the build artifacts. EAS Build uses the `fast-glob` npm package for pattern matching, ([see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax)). You should modify that path only if you are using a custom `Gymfile`. The default is `ios/build/App.ipa`.
- `releaseChannel` is the release channel for the `expo-updates` package ([Learn more about this](../distribution/release-channels.md)). If you do not specify a channel, your binary will pull releases from the `default` channel. If you do not use `expo-updates` in your project then this property will have no effect.
- `distribution` is the flow of distributing your app. If you choose `internal` you'll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. Choose `simulator` to run the app on an iOS simulator on your computer. The default is `store` which means your build URLs won't be sharable. [Learn more about internal distribution](internal-distribution.md).
- `enterpriseProvisioning` should only be used with `"distribution": "internal"` when you have an Apple account with Apple Developer Enterprise Program membership. You can choose if you want to use `adhoc` or `universal` provisioning. The latter is recommended as it does not require you to register each individual device. If you don't provide this option and you still authenticate with an enterprise team, you'll be prompted which provisioning to use.
- `autoIncrement` controls how EAS CLI bumps your application build version. The App Store uses two values from `Info.plist` to identify the app build: `CFBundleShortVersionString` and `CFBundleVersion`. `CFBundleShortVersionString` is the version visible to users, whereas `CFBundleVersion` defines the build number. The combination of those needs to be unique, so you can bump either of them. When set to `version`, the patch of `CFBundleShortVersionString` is bumped (e.g. `1.2.3` -> `1.2.4`). When set to `buildNumber`, the last component of `CFBundleVersion` is bumped (e.g. `1.2.3.39` -> `1.2.3.40`). Versions will also be updated in app.json. `expo.version` corresponds to `CFBundleShortVersionString` and `expo.ios.buildNumber` to `CFBundleVersion`. Defaults to `false` - versions won't be bumped automatically.
- `image` - image with build environment. [Learn more about it here](../build-reference/infrastructure).
- `node` - version of Node.js
- `yarn` - version of Yarn
- `bundler` - version of [bundler](https://bundler.io/)
- `fastlane` - version of fastlane
- `cocoapods` - version of CocoaPods
- `env` - environment variables that should be set during the build process (should only be used for values that you would commit to your git repository, i.e. not passwords or secrets).
- `cache` configures paths that will be saved and restored in the next build. The cache can be explicitly invalidated by updating the value of the `key` field. Values in `customPaths` support both absolute and relative paths, where relative paths are resolved from the directory with `eas.json`. If you set `cacheDefaultPaths` to true, or leave the `cache` config unspecified, `Podfile.lock` will be cached by default. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn't work well for `node_modules` because the cache is not local to the machine, so a download speed is similar to downloading from the npm registry. Set `"disabled": true` to disable caching.

#### Examples

This is the minimal working example. EAS CLI will ask you for the app's credentials and you'll be provided with the URL to the `ios/build/App.ipa` file.

```json
{
  "workflow": "generic"
}
```

If you'd like to build your iOS project with a custom `Gymfile` ([learn more on this here](/build-reference/ios-builds.md#building-ios-projects-with-fastlane)) where you've defined a different output directory than `ios/build`, use the following example:

<!-- prettier-ignore -->
```json
{
  "workflow": "generic",
  "artifactPath": /* @info determined by output_directory and output_name in Gymfile */ "ios/my/build/directory/RNApp.ipa" /* @end */

}
```

### Managed Project

The schema of a build profile for a managed iOS project looks like this:

```json
{
  "workflow": "managed",
  "extends": string,
  "credentialsSource": "local" | "remote", // default: "remote"
  "buildType": "release" | "development-client", // default: "release"
  "releaseChannel": string, // default: "default"
  "distribution": "store" | "internal" | "simulator", // default: "store"
  "enterpriseProvisioning": "adhoc" | "universal",
  "autoIncrement": boolean | "version" | "buildNumber", // default: false
  "image": string, // default: "default"
  "node": string,
  "yarn": string,
  "expoCli": string,
  "bundler": string,
  "fastlane": string,
  "cocoapods": string,
  "env": Record<string, string>,
  "cache": {
    "disabled": boolean, // default: false
    "key": string,
    "cacheDefaultPaths": boolean, // default: true
    "customPaths": string[] // default: []
  }
}
```

- `"workflow": "managed"` indicates that your project is a managed one.
- `extends` allows extending values from another build profile.
- `credentialsSource` defines the source of credentials for this build profile. If you want to provide your own `credentials.json` file, set this to `local` ([learn more on this here](/app-signing/local-credentials.md)). If you want to use the credentials managed by EAS, choose `remote` (this is the default option).
- `buildType` when set to `release` it produces a release archive, but when set to `development-client` it produces a debug archive.
- `releaseChannel` is the release channel for the `expo-updates` package ([Learn more about this](../distribution/release-channels.md)). If you do not specify a channel, your binary will pull releases from the `default` channel. If you do not use `expo-updates` in your project then this property will have no effect.
- `distribution` is the flow of distributing your app. If you choose `internal` you'll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. Choose `simulator` to run the app on an iOS simulator on your computer. The default is `store` which means your build URLs won't be sharable. [Learn more Internal Distribution](internal-distribution.md).
- `enterpriseProvisioning` should only be used with `"distribution": "internal"` when you have an Apple account with Apple Developer Enterprise Program membership. You can choose if you want to use `adhoc` or `universal` provisioning. The latter is recommended as it does not require you to register each individual device. If you don't provide this option and you still authenticate with an enterprise team, you'll be prompted which provisioning to use.
- `autoIncrement` controls how EAS CLI bumps your application build version. When set to `version`, the patch component of `expo.version` is bumped (e.g. `1.2.3` -> `1.2.4`). When set to `buildNumber`, the last component of `expo.ios.buildNumber` is bumped (e.g. `1.2.3.39` -> `1.2.3.40`). Defaults to `false` - versions won't be bumped automatically.
- `image` - image with build environment. [Learn more about it here](../build-reference/infrastructure).
- `node` - version of Node.js
- `yarn` - version of Yarn
- `expoCli` - version of [expo-cli](https://www.npmjs.com/package/expo-cli) used to [prebuild](../workflow/expo-cli/#expo-prebuild) your app
- `bundler` - version of [bundler](https://bundler.io/)
- `fastlane` - version of fastlane
- `cocoapods` - version of CocoaPods
- `env` - environment variables that should be set during the build process (should only be used for values that you would commit to your git repository, i.e. not passwords or secrets).
- `cache` configures paths that will be saved and restored in the next build. The cache can be explicitly invalidated by updating the value of the `key` field. Values in `customPaths` support both absolute and relative paths, where relative paths are resolved from the directory with `eas.json`. If you set `cacheDefaultPaths` to true, or leave the `cache` config unspecified, `Podfile.lock` will be cached by default. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn't work well for `node_modules` because the cache is not local to the machine, so a download speed is similar to downloading from the npm registry. Set `"disabled": true` to disable caching.

#### Examples

This is the minimal working example. EAS CLI will ask you for the app's credentials and you'll be provided with the URL to the `ios/build/App.ipa` file.

```json
{
  "workflow": "managed"
}
```

## Overall Example

The following example of `eas.json` configures both Android and iOS builds:

```json
{
  "builds": {
    "android": {
      "base": {
        "workflow": "generic",
        "image": "ubuntu-18.04-android-30-ndk-r19c",
        "ndk": "21.4.7075529",
        "env": {
          "EXAMPLE_ENV": "example value"
        }
      },
      "release": {
        "extends": "base",
        "env": {
          "ENVIRONMENT": "production"
        }
      },
      "debug": {
        "extends": "base",
        "withoutCredentials": true,
        "gradleCommand": ":app:assembleDebug",
        "artifactPath": "android/app/build/outputs/apk/debug/app-debug.apk",
        "env": {
          "ENVIRONMENT": "staging"
        }
      }
    },
    "ios": {
      "release": {
        "workflow": "generic",
        "image": "macos-catalina-11.15-xcode-12.1",
        "node": "12.13.0",
        "yarn": "1.22.5",
        "artifactPath": "ios/my/build/directory/RNApp.ipa"
      },
      "adhoc": {
        "workflow": "generic",
        "image": "latest",
        "distribution": "internal"
      }
    }
  }
}
```
