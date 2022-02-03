---
title: Installing react-native-unimodules
hidden: true
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

> 🚨 **This library is deprecated!**
>
> As of Expo SDK 43, [react-native-unimodules is deprecated in favor of the expo package](https://blog.expo.dev/whats-new-in-expo-modules-infrastructure-7a7cdda81ebc). Please refer to the [Installing Expo modules guide](../bare/installing-expo-modules).

This library contains infrastructure and a small set of foundational libraries and interfaces that are commonly depended on by other modules. You can install react-native-unimodules in any react-native app, and once it is installed you can use most of the libraries from the Expo SDK, like expo-camera, expo-media-library and many more.

## Installation

> The following instructions for installing `react-native-unimodules` are present only for archival purposes, we advise that you do not install the library in any new projects and that you [use Expo modules instead](../bare/installing-expo-modules.md).

<InstallSection packageName="react-native-unimodules" cmd={["npm install react-native-unimodules", "npx pod-install"]} hideBareInstructions />

<br />

Once installation is complete, apply the changes from the following diffs to configure react-native-unimodules in your project. This is expected to take about five minutes, and you may need to adapt it slightly depending on how customized your project is.

## Configuration for iOS

<ConfigurationDiff source="/static/diffs/react-native-unimodules-ios.diff" />

<details><summary><h4>💡 Need to customize node_modules path?</h4></summary>
<p>

If you need to customize the path to node_modules, for example because you are using yarn workspaces, then you can pass in a param for this: `use_unimodules!(modules_paths: ['./path/to/node_modules'])`. Alternatively, you can configure this in **package.json**:


```json
{
  "name": "...",
  "dependencies": {},
  "react-native-unimodules": {
    "ios": {
      "modulesPaths": [
        "./path/to/node_modules"
      ]
    }
  }
}
```

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Need to exclude some unimodules that are being automatically linked?</h4></summary>
<p>

If you need to exclude some of the unimodules that you are not using but they got installed by your other dependencies (like `expo`), then you can pass in `exclude` param for this. For example, if you want to exclude `expo-face-detector`, you may want to use this: `use_unimodules!(exclude: ['expo-face-detector'])`. Alternatively, you can configure this in **package.json**:

```json
{
  "name": "...",
  "dependencies": {},
  "react-native-unimodules": {
    "ios": {
      "exclude": [
        "expo-face-detector"
      ]
    }
  }
}
```

</p>
</details>

<br />

Save all of your changes. In Xcode, update the iOS Deployment Target under `Target → Build Settings → Deployment` to `iOS 11.0`. The last step is to install the project's CocoaPods again in order to pull in unimodules that are detected by `use_unimodules!` directive that we added to the `Podfile`:

<InstallSection packageName="react-native-unimodules" cmd={["npx pod-install"]} hideBareInstructions />

<div style={{marginTop: 50}} />

## Configuration for Android

<ConfigurationDiff source="/static/diffs/react-native-unimodules-android.diff" />

<details><summary><h4>💡 Need to customize node_modules path?</h4></summary>
<p>

If you need to customize the path to node_modules, for example because you are using yarn workspaces, then you can pass in a param `modulesPaths` for both of these functions: `includeUnimodulesProjects([modulesPaths: ['./path/to/node_modules']])`, `addUnimodulesDependencies([modulesPaths: ['./path/to/node_modules']])`. Alternatively, you can configure this in **package.json**:

```json
{
  "name": "...",
  "dependencies": {},
  "react-native-unimodules": {
    "android": {
      "modulesPaths": [
        "./path/to/node_modules"
      ]
    }
  }
}
```

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Need to exclude some unimodules that are being automatically linked?</h4></summary>
<p>

If you need to exclude some of the unimodules that you are not using but they got installed by your other dependencies (like `expo`), then you can pass in `exclude` param for this. For example, if you want to exclude `expo-face-detector`, you may want to use this: `addUnimodulesDependencies([exclude: ['expo-face-detector']])` and `includeUnimodulesDependencies([exclude: ['expo-face-detector']])`. Alternatively, you can configure this in **package.json**:

```json
{
  "name": "...",
  "dependencies": {},
  "react-native-unimodules": {
    "android": {
      "exclude": [
        "expo-face-detector"
      ]
    }
  }
}
```

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Need to customize configuration of unimodule dependencies?</h4></summary>
<p>

You can also customize the configuration of the unimodules dependencies (the default is `implementation`, if you're using Gradle older than 3.0, you will need to set `configuration: "compile"` in `addUnimodulesDependencies`, like: `addUnimodulesDependencies([configuration: "compile"])`). Alternatively, you can configure this in **package.json**:

```json
{
  "name": "...",
  "dependencies": {},
  "react-native-unimodules": {
    "android": {
      "configuration": "compile"
    }
  }
}
```

</p>
</details>

<div style={{marginTop: 50}} />

## Usage

An easy way to verify installation is successful is to log a value from [Constants](/versions/latest/sdk/constants/).

```js
import { Constants } from 'react-native-unimodules';
console.log(Constants.systemFonts);
```

It's possible that you will not have to use any of the code provided by this package directly, it may be used only by other Expo modules that you install. You will likely want to use something like [FileSystem](/versions/latest/sdk/filesystem/), and to do that you can import the following modules like so:

```js
import { Asset, Constants, FileSystem } from 'react-native-unimodules';
```
