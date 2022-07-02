---
title: Configuring EAS Build with eas.json
sidebar_title: Configuration with eas.json
---

**eas.json** is the configuration file for EAS CLI and services. It is located at the root of your project next to your **package.json**. Configuration for EAS Build all belongs under the `"build"` key. A minimal **eas.json** may look something like this:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## Build profiles

A build profile is a named grouping of configuration that describes the necessary parameters to perform a certain type of build.

The JSON object under the `build` key can contain multiple build profiles, and you can name these build profiles whatever you like; in the above example, there are three build profiles: `development`, `preview`, and `production`, but these could have been named `foo`, `bar`, and `baz` if that was your preference.

To run a build with a specific profile, execute `eas build --profile <profile-name>`. If you omit the `--profile` flag, EAS CLI will default to using the profile with the name **production**, if it exists.

### Platform-specific and common options

Inside each build profile you can specify `android` and `ios` fields that contain platform-specific configuration for the build. Fields that are available to both platforms can be provided on the platform-specific configuration object or on the root of the profile.

### Sharing configuration between profiles

Build profiles can extend another build profile using the `"extends"` key. For example, in the `preview` profile you may have `"extends": "production"`; this would make the `preview` profile inherit configuration of the `production` profile.

## Common use cases

Developers using Expo tools usually end up having three different types of builds: **development**, **preview**, and **production**.

### Development builds

These builds include developer tools, and they are never submitted to an app store.

By default, `eas build:configure` will create a `development` profile with `"developmentClient": true`. This indicates that this build depends on [expo-dev-client](/clients/introduction.md).

The `development` profile also defaults to `"distribution": "internal"`. This will make it easy to distribute your app directly to physical iOS and Android devices &mdash; [learn more](/build/internal-distribution.md).

You may alternatively prefer for your development build to [run in an iOS simulator](/build-reference/simulators.md). To do this, use the following configuration for `development` profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    }
    // ...
  }
  // ...
}
```

If you'd like to create a build for internal distribution and another for the iOS simulator then you can create another development profile for that build. You might call the profile something like `development-simulator` and use the above configuration on that profile instead of on `development`. [No such configuration is required to run an Android APK on your device and in an emulator](/build-reference/apk.md); the same APK will work in both circumstances.

### Preview builds

These builds don't include developer tools, they are intended to be installed by your team and other stakeholders, to test out the app in production-like circumstances. In this way, they are similar to [production builds](#production-builds); the difference arises in that they are either not signed for distribution on stores (ad hoc or enterprise provisioning on iOS), or are packaged in a way that is not optimal for store deployment (Android APK is best for preview, AAB is best for stores).

A minimal `preview` profile looks like this:

```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    }
    // ...
  }
  // ...
}
```

Similar to [development builds](#development-builds), you can configure your preview build to run in the [iOS simulator](/build-reference/simulators.md) or create a variant of your preview profile for that purpose. [No such configuration is required to run an Android APK on your device and in an emulator](/build-reference/apk.md); the same APK will work in both circumstances.

### Production builds

These builds are submitted to an app store, for release to the general public or as part of a store-facilitated testing process such as TestFlight.

Production builds must be installed through their respective app stores; they cannot be installed directly to your iOS device/simulator or Android device/emulator. The only exception to this if you explicitly set `"buildType": "apk"` for Android on your build profile; however, it is recommended to use AAB when submitting to stores, and this is the default configuration.

A minimal `production` profile looks like this:

```json
{
  "build": {
    "production": {}
    // ...
  }
  // ...
}
```

### Installing multiple builds of the same app on a single device

It's common to have development and production builds installed simultaneously on the same device. [Learn about "installing app variants on the same device"](../build-reference/variants.md).

## Configuring your build tools

Every build depends either implicitly or explicitly on a specific set of versions of related tools that are needed to carry out the build process. These include, but are not limited to: Node.js, npm, yarn, Ruby, Bundler, Cocoapods, Fastlane, Xcode, and Android NDK.

### Selecting build tool versions

Versions for the most common build tools can be set on build profiles with fields corresponding to names of the tools, for example `"node"`:

```json
{
  "build": {
    "production": {
      "node": "16.13.0"
    }
    // ...
  }
  // ...
}
```

It's common to want to share build tool configuration between profiles, and we can use `extends` for that:

```json
{
  "build": {
    "production": {
      "node": "16.13.0"
    },
    "preview": {
      "extends": "production",
      "distribution": "internal"
    },
    "development": {
      "extends": "production",
      "developmentClient": "true",
      "distribution": "internal"
    }
    // ...
  }
  // ...
}
```

### Selecting a base image

The base image for the build job controls the default versions for a variety of dependencies, such as Node.js, Yarn, and Cocoapods. You can override them using the specific named fields as described above. However, the image includes specific versions of tools that can't be explicitly set any other way, such as the operating system version and Xcode version.

If you are using the Expo managed workflow, EAS Build will pick the appropriate image to use with a reasonable set of dependencies for the SDK version that you are building for. Otherwise, it is recommended to read about the available images on ["Build server infrastructure"](/build-reference/infrastructure.md).

## Environment variables

You can configure environment variables on your build profiles using the `"env"` field. These environment variable will be used to evaluate **app.config.js** locally when you run `eas build`, and they will also be set on the EAS Build worker.

```json
{
  "build": {
    "production": {
      "node": "16.13.0",
      "env": {
        "API_URL": "https://company.com/api"
      }
    },
    "preview": {
      "extends": "production",
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging.company.com/api"
      }
    }
    // ...
  }
  // ...
}
```

The ["Environment variables and secrets" reference](/build-reference/variables.md) explains this topic in greater detail, and the [updates guide](/build/updates.md) provides guidance on considerations when using this feature alongside **expo-updates**.
