---
title: Installing react-native-unimodules
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

This library contains infrastructure and a small set of foundational libraries and interfaces that are commonly depended on by other modules. You can install react-native-unimodules in any react-native app, and once it is installed you can use most of the libraries from the Expo SDK, like expo-camera, expo-media-library and many more.

> 💡 If you are creating a new project, we recommend using `npx create-react-native-app` instead of `npx react-native init` because it will handle the following configuration for you automatically.

## Installation

<InstallSection packageName="react-native-unimodules" cmd={["npm install react-native-unimodules", "npx pod-install"]} hideBareInstructions />

<br />

Once installation is complete, apply the changes from the following diffs to configure react-native-unimodules in your project. This is expected to take about five minutes, and you may need to adapt it slightly depending on how customized your project is.

## Configuration for iOS

<ConfigurationDiff source="/static/diffs/react-native-unimodules-ios.diff" />

<details><summary><h4>💡 Need to customize node_modules path?</h4></summary>
<p>

If you need to customize the path to node_modules, for example because you are using yarn workspaces, then you can pass in a param for this: `use_unimodules!(modules_paths: ['./path/to/node_modules'])`

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Need to exclude some unimodules that are being automatically linked?</h4></summary>
<p>

If you need to exclude some of the unimodules that you are not using but they got installed by your other dependencies (like `expo`), then you can pass in `exclude` param for this. For example, if you want to exclude `expo-face-detector`, you may want to use this: `use_unimodules!(exclude: ['expo-face-detector'])`

</p>
</details>

<div style={{marginTop: 50}} />

## Configuration for Android

<ConfigurationDiff source="/static/diffs/react-native-unimodules-android.diff" />

<details><summary><h4>💡 Need to customize node_modules path?</h4></summary>
<p>

If you need to customize the path to node_modules, for example because you are using yarn workspaces, then you can pass in a param `modulesPaths` for both of these functions: `includeUnimodulesProjects([modulesPaths: ['./path/to/node_modules']])`, `addUnimodulesDependencies([modulesPaths: ['./path/to/node_modules']])`

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Need to exclude some unimodules that are being automatically linked?</h4></summary>
<p>

If you need to exclude some of the unimodules that you are not using but they got installed by your other dependencies (like `expo`), then you can pass in `exclude` param for this. For example, if you want to exclude `expo-face-detector`, you may want to use this: `addUnimodulesDependencies([exclude: ['expo-face-detector']])`

</p>
</details>

<div style={{marginTop: -10}} />

<details><summary><h4>💡 Need to customize configuration of unimodule dependencies?</h4></summary>
<p>

You can also customize the configuration of the unimodules dependencies (the default is `implementation`, if you're using Gradle older than 3.0, you will need to set `configuration: "compile"` in `addUnimodulesDependencies`, like: `addUnimodulesDependencies([configuration: "compile"])`)

</p>
</details>

<div style={{marginTop: 50}} />

## Usage

An easy way to verify installation is successful is to log a value from [Constants](/versions/latest/sdk/constants/).

```js
import { Constants } from 'react-native-unimodules';
console.log(Constants.systemFonts);
```

It's possible that you will not have to use any of the code provided by this package directly, it may be used only by other Expo modules that you install. You will likely want to use something like [FileSystem](/versions/latest/sdk/filesystem/) or [Permissions](/versions/latest/sdk/permissions/), and to do that you can import the following modules like so:

```js
import { Asset, Constants, FileSystem, Permissions } from 'react-native-unimodules';
```
