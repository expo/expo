---
title: Installing Expo modules
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

> Are you migrating from `react-native-unimodules`? Please refer to [the Expo modules migration guide](https://expo.fyi/expo-modules-migration).

In order to use Expo modules in your app, you will need to install and configure the `expo` package.

The `expo` package has a small footprint; it includes only a minimal set of packages that are needed in nearly every app and the module and autolinking infrastructure that other Expo SDK packages are built with. Once the `expo` package is installed and configured in your project, you can use `expo install` to add any other Expo module from the SDK.

The easiest way to get started with Expo modules is to initialize a new bare workflow project with Expo CLI: `expo init --template bare-minimum`.

If you have an existing project without Expo modules installed (perhaps created with `npx react-native init`), please follow the automatic or manual installation instructions below.

## Automatic installation

Aside from initializing a new project with `expo-cli`, the easiest way to get up and running is with the `install-expo-modules` command.

<InstallSection packageName="expo" cmd={["# Install and configure the expo package automatically", "npx install-expo-modules"]} hideBareInstructions />

- ✅ **When the command succeeds**, you will be able any Expo module in your app! Proceed to [Usage](#usage) for more information.
- ❌ **If the command fails**, please follow the manual installation instructions. Updating code programmatically can be tricky, and if your project deviates significantly from a default React Native project then manual installation is needed in order to adapt the instructions to your codebase.

## Manual installation

<InstallSection packageName="expo" cmd={["npm install expo"]} hideBareInstructions />

<br />

Once installation is complete, apply the changes from the following diffs to configure Expo modules in your project. This is expected to take about five minutes, and you may need to adapt it slightly depending on how customized your project is.

### Configuration for iOS

<ConfigurationDiff source="/static/diffs/expo-ios.diff" />

Save all of your changes. In Xcode, update the iOS Deployment Target under `Target → Build Settings → Deployment` to `iOS 12.0`. The last step is to install the project's CocoaPods again in order to pull in Expo modules that are detected by `use_expo_modules!` directive that we added to the `Podfile`:

<InstallSection packageName="expo" cmd={["# Install pods", "npx pod-install", "", "# Alternatively, the run command will install them for you", "expo run:ios"]} hideBareInstructions />

<div style={{marginTop: 50}} />

### Configuration for Android

<ConfigurationDiff source="/static/diffs/expo-android.diff" />

<div style={{marginTop: -10}} />

## Usage

### Verifying installation

You can verify that installation was successful by logging a value from [expo-constants](/versions/latest/sdk/constants/). Run `expo install expo-constants`, then run `expo run:[android|ios]` and modify your app JavaScript code to add the following:

```js
import Constants from 'expo-constants';
console.log(Constants.systemFonts);
```

### Using Expo SDK packages

Once the `expo` package is installed and configured in your project, you can use `expo install` to add any other Expo module from the SDK. Learn more in ["Using Libraries"](../using-libraries.md).

### Expo modules included in the `expo` package

The following Expo modules are brought in as dependencies of the `expo` package:

- [expo-application](/versions/latest/sdk/application.md) - Generates the installation id in remote logging in development. This module is optional and can be safely removed if you do not use `expo-dev-client`.
- [expo-asset](/versions/latest/sdk/asset.md) - A JavaScript-only package that builds around `expo-file-system` and provides a common foundation for assets across all Expo modules.
- [expo-constants](/versions/latest/sdk/constants.md) - Provides access to the manifest.
- [expo-file-system](/versions/latest/sdk/filesystem.md) - Interact with the device file system. Used by `expo-asset` and many other Expo modules. Commonly used directly by developers in application code.
- [expo-font](/versions/latest/sdk/font.md) - Load fonts at runtime. This module is optional and can be safely removed, however; it is recommended if you use `expo-dev-client` for development and it is required by `@expo/vector-icons`.
- [expo-keep-awake](/versions/latest/sdk/keep-awake.md) - Prevents your device from going to sleep while developing your app. This module is optional and can be safely removed.

To exclude any of these modules, refer to the following guide on [excluding modules from autolinking](#excluding-specific-modules-from-autolinking).


### Excluding specific modules from autolinking

If you need to exclude Expo modules that you are not using but they got installed by other dependencies, you can use the `expo.autolinking` field in **package.json**:

```json
{
  "name": "...",
  "dependencies": {},
  "expo": {
    "autolinking": {
      "exclude": ["expo-keep-awake"]
    }
  }
}
```

You can exclude only for a specific platform by using `exclude` under the platform key:

```json
{
  "name": "...",
  "dependencies": {},
  "expo": {
    "autolinking": {
      "exclude": ["expo-font"],
      "ios": {
        "exclude": ["expo-keep-awake"]
      }
    }
  }
}
```
