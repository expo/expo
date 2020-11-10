---
title: Configuration with eas.json
---

`eas.json` is your go-to place for configuring EAS Build <small>(and other EAS services soon...)</small>. It is located at the root of your project next to your `package.json`. It looks something like this:

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

Each object under the platform key can contain multiple build profiles. Every build profile can have an arbitrary name. The default profile that is expected by Expo CLI to exist is `release` (if you'd like to build your app using another build profile you need to specify it with a parameter - `expo eas:build --platform android --profile foobar`). In the example, there are two build profiles (one for Android and one for iOS) and they are both named `release`. However, they could be named `foo` or `bar` if you'd like to.

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

Where `PLATFORM_NAME` is one of `android` or `ios`.

## Build Profiles

There are two types of build profiles - generic and managed. _(Building managed projects is not supported at the moment.)_

**Generic projects** make almost no assumptions about your project's structure. The only requirement is that your project follows the general structure of React Native projects. This means there are `android` and `ios` directories in the root directory with the Gradle and Xcode projects, respectively. No matter if you've intialized your project with `expo init` or with `npx react-native init`, you should be able to build it with EAS Build.

**Managed projects** are much simpler in terms of the project's structure and the knowledge needed to start developing your application. Those projects don't have the native code in the repository and they are tightly coupled with Expo.

## Android

### Generic project

The schema of a build profile for a generic Android project looks like this:

```json
{
  "workflow": "generic",
  "credentialsSource": "local" | "remote" | "auto", // default: "auto"
  "withoutCredentials": boolean, // default: false
  "gradleCommand": string, // default: ":app:bundleRelease"
  "artifactPath": string // default: "android/app/build/outputs/**/*.{apk,aab}"
}
```

- `"workflow": "generic"` indicates that your project is a generic one.
- `credentialsSource` defines the source of credentials for this build profile. If you want to take advantage of your own `credentials.json` file, set this to `local` ([learn more on this here](advanced-credentials-configuration.md)). If you want to use the credentials Expo already has stored for you, choose `remote`. If you're not sure what to do but you probably won't be running builds from a CI, choose `auto` (this is the default option).
- `withoutCredentials` when set to `true`, Expo CLI won't require you to configure credentials when building the app using this profile. It comes in handy when you want to build debug binaries and the debug keystore is checked in to the repository. The default is `false`.
- `gradleCommand` defines the Gradle task to be run on Expo servers to build your project. You can set it to any valid Gradle task, e.g. `:app:assembleDebug` to build a debug binary. The default Gradle command is `:app:bundleRelease`.
- `artifactPath` is the path (or pattern) where EAS Build is going to look for the build artifacts. EAS Build uses the `fast-glob` npm package for pattern matching, [see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax). The default value is `android/app/build/outputs/**/*.{apk,aab}`.

#### Examples

This is the minimal working example. Expo CLI will ask you for the app's credentials, the project will be built with the `./gradlew :app:bundleRelease` command, and you'll receive an archive containing the `android/app/build/outputs/bundle/release/app-release.aab` file.

```json
{
  "workflow": "generic"
}
```

If you'd like to build a release APK (AAB is built by default), use this example:

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

Managed projects are not supported at the moment but the profile's schema is going to look like this:

```json
{
  "workflow": "managed",
  "credentialsSource": "local" | "remote" | "auto", // default: "auto"
  "buildType": "app-bundle" | "apk" // default: "app-bundle"
}
```

## iOS

### Generic Project

The schema of a build profile for a generic iOS project looks like this:

```json
{
  "workflow": "generic",
  "credentialsSource": "local" | "remote" | "auto", // default: "auto"
  "scheme": string,
  "artifactPath": string // default: "ios/build/App.ipa"
}
```

- `"workflow": "generic"` indicates that your project is a generic one.
- `credentialsSource` defines the source of credentials for this build profile. If you want to take advantage of your own `credentials.json` file, set this to `local` ([learn more on this here](advanced-credentials-configuration.md)). If you want to use the credentials Expo already has stored for you, choose `remote`. If you're not sure what to do but you probably won't be running builds from a CI, choose `auto` (this is the default option).
- `scheme` defines the Xcode project's scheme to build. You should set it if your project has multiple schemes. Please note that if the project has only one scheme, it will automatically be detected. However, if multiple schemes exist and this value is **not** set, Expo CLI will prompt you to select one of them.
- `artifactPath` is the path (or pattern) where EAS Build is going to look for the build artifacts. EAS Build uses the `fast-glob` npm package for pattern matching, [see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax). You should modify that path only if you are using a custom `Gymfile`. The default is `ios/build/App.ipa`.

#### Examples

This is the minimal working example. Expo CLI will ask you for the app's credentials and you'll receive an archive containing the `ios/build/App.ipa` file.

```json
{
  "workflow": "generic"
}
```

If you'd like to build your iOS project with a custom `Gymfile` ([learn more on this here](ios-builds.md#building-ios-projects-with-fastlane)) where you've defined a different output directory than `ios/build`, use the following example:

<!-- prettier-ignore -->
```json
{
  "workflow": "generic",
  "artifactPath": /* @info determined by output_directory and output_name in Gymfile */ "ios/my/build/directory/RNApp.ipa" /* @end */

}
```

### Managed Project

Managed projects are not supported at the moment but the profile's schema is going to look like this:

```json
{
  "workflow": "managed",
  "credentialsSource": "local" | "remote" | "auto", // default: "auto"
  "buildType": "archive" | "simulator" // default: "archive"
}
```

## Overall Example

The following example of `eas.json` configures both Android and iOS builds:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      },
      "debug": {
        "workflow": "generic",
        "withoutCredentials": true,
        "gradleCommand": ":app:assembleDebug",
        "artifactPath": "android/app/build/outputs/apk/debug/app-debug.apk"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic",
        "artifactPath": "ios/my/build/directory/RNApp.ipa"
      }
    }
  }
}
```

For Android, there are two build profiles - `release` and `debug`. The `release` profile is just a basic generic profile. On the other hand, `debug` will let you build a debug APK for your project. _If you want to build using the `debug` profile, run `expo eas:build --platform android --profile debug`._

For iOS, we've defined a generic profile for the project which takes advantage of a custom `Gymfile`, thus the custom `artifactPath` field.
