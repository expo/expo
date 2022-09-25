---
title: Glossary of terms
---

### Android

The mobile operating system sponsored by Google for use with "Android" devices.

### app.json

An [Expo Config](#expo-config) file.

### Apple Capabilities

Cloud services provided by Apple. These services must be enabled for an application in the [Apple Developer Portal](#apple-developer-portal).

### Apple Developer Portal

Apple's [official website](https://developer.apple.com/) for managing application code signing. EAS Credentials automate most of the common reasons a developer might visit this website when developing an app.

### Auto Capability Signing

A feature of EAS build that automatically enables or disables [Apple capabilities](#apple-capabilities) based on the project's entitlements file. [Learn more](/build-reference/ios-capabilities/).

### Autolinking

A cross-platform tool for automatically linking native modules to native apps via native package managers.

- On iOS the tool is used in [CocoaPods](#cocoapods) `ios/Podfile` and invoked during `pod install`.
- On Android the tool is used in the `android/app/build.gradle` and invoked during the [Gradle](#gradle) sync process.

There are two versions of Autolinking: [Expo Autolinking](#expo-autolinking), and [Community Autolinking](#community-autolinking).

The default [Prebuild template](#prebuild-template) includes support for [Expo Autolinking](#expo-autolinking), and the [Community Autolinking](#community-autolinking) fork.

### Babel

Transpiler used for removing language features that aren't available in the runtime's [JavaScript engine](#javascript-engine). [Metro](#metro-bundler) uses Babel internally. Project's can configure how Babel is used by modifying the `babel.config.js` file in their project directory. This file is optional when using [Expo CLI](#expo-cli). Expo projects should extend the default Babel preset [`babel-preset-expo`](https://github.com/expo/expo/tree/main/packages/babel-preset-expo).

### CocoaPods

The iOS package manager, used to link native modules to the native iOS project. This package manager is configured using the `ios/Podfile`, and updated when a user runs `pod install` in the `ios` directory.

### Community Autolinking

This refers to the React Native community [fork](https://github.com/react-native-community/cli/issues/248#issue-422591744) of the [Expo Autolinking](#expo-autolinking). The requirements for linking a module different to [Expo Autolinking](#expo-autolinking) but the implementation is the same.

### Config Introspection

A process for evaluating the results of [`npx expo prebuild`](#prebuild) in-memory without persisting any code changes. This is used in [Auto Capability Signing](#auto-capability-signing) to determine what the entitlements file will look like without generating any native code. This process is also used in the [VS Code Expo](#vs-code-expo) extension to debug [Config Mods](#config-mods).

### Config Mods

Async functions that are appended to the [Expo Config](#expo-config) for use in [Prebuild](#prebuild). These functions are given a single native file to modify like Info.plist or AndroidManifest.xml. Config Mods are chained together and come from the package `@expo/config-plugins`. For more information, see [Config Plugins](/guides/config-plugins).

### Config Plugin

A JavaScript function that is used to append [config mods](#config-mods) to the [Expo Config](#expo-config) for use in [Prebuild](#prebuild). For more information, see [Config Plugins](/guides/config-plugins).

### create-expo-app

A standalone command line tool (CLI) for bootstrapping new React Native apps with the `expo` package installed.

This package can be used by running any of the following commands:

- `npx create-expo-app`
- `yarn create expo-app`
- `npm create expo-app`

### create-react-native-app

A standalone command line tool (CLI) for bootstrapping new React Native apps with the `expo` package installed and the native code generated. This CLI also enables the use of bootstrapping from an example project in [expo/examples](https://github.com/expo/examples).

This package can be used by running any of the following commands:

- `npx create-expo-app`
- `yarn create expo-app`
- `npm create expo-app`

### Dangerous Mods

Config [modifiers](#config-mods) that apply unstable changes to a native project during [prebuild](#prebuild). Use of these modifiers is unpredictable and prone to breaking changes between major version bumps in [Expo SDK](#expo-sdk).

### detach

> Deprecated technology

The term "detach" was previously used in Expo to mean [ejecting](#eject) your app to use [ExpoKit](#expokit).

### Dev Clients

A [native runtime](#native-runtime) that has been built in development mode. These builds often include the `expo-dev-client` [native module](#native-module) for improved debugging.

### Development Server

A development server (or dev server) is a server that is started locally, usually by running `npx expo start` from [Expo CLI](#expo-cli).

The development server is typically hosted on `http://localhost:19000`. It hosts a [manifest](#manifest) from `/` which the client uses to request the JavaScript bundle from the bundler.

### EAS

[Expo Application Services (EAS)](/eas/index.md) are deeply-integrated cloud services for Expo and React Native apps, such as [EAS Build](/build/introduction.md) and [EAS Submit](/submit/introduction.md).

### EAS CLI

The command-line tool for working with EAS. {/* Pending creation of eas-cli [Read more](eas-cli.md). */}

### EAS Config

The `eas.json` file used to configure [EAS CLI](#eas-cli). For more information, see [Configuring EAS Build with `eas.json`](/build/eas-json/).

### EAS Metadata

A command line tool for uploading and downloading Apple App Store metadata as JSON. This tool is available in the [EAS CLI](#eas-cli) package and should be used to improve the iOS submission process, see [EAS Metadata](../eas/metadata/index.md).

### EAS Update

1. The cloud hosting service [EAS Update](/eas-update/introduction/) that is used for OTA Updates.
2. The CLI command `eas update` from [EAS CLI](#eas-cli) that is used to publish static files to the cloud hosting service.

### eject

> Deprecated technology

The term "eject" was popularized by [create-react-app](https://github.com/facebookincubator/create-react-app), and it is used in Expo to describe leaving the cozy comfort of the standard Expo development environment, where you do not have to deal with build configuration or native code. When you "eject" from Expo, you have two choices:

- _Eject to bare workflow_, where you jump between [workflows](../introduction/managed-vs-bare.md) and move into the bare workflow, where you can continue to use Expo APIs but have access and full control over your native iOS and Android projects.
- _Eject to ExpoKit_, where you get the native projects along with [ExpoKit](#expokit). This option is deprecated and support for ExpoKit was removed after SDK 38.

### Emulator

Emulator is used to describe software emulators of Android devices on your computers. Typically iOS emulators are referred to as [Simulators](#simulator).

### Entry Point

The entry point usually refers to the initial JavaScript file used to load an application. In apps using [Expo CLI](#expo-cli), the default entry point is `./node_modules/expo/AppEntry.js` which simply imports the **App.js** file from the root project directory and registers it as the initial component in the native app.

### Experience

A synonym for app that usually implies something more single-use and smaller in scope, sometimes artistic and whimsical.

### Expo Autolinking

The original [Autolinking](#autolinking) system that is designed for projects using `expo-modules-core`. This system links modules based on the existence of an `expo-module.config.json` file in the library's root directory.

### Expo CLI

The command-line tool for working with Expo. This term now refers to the [Local Expo CLI](#local-expo-cli), but historically referred to the [Global Expo CLI](#global-expo-cli). For more information, see [Expo CLI](expo-cli.md).

### Expo client

The former name for the [Expo Go](#expo-go) app.

### Expo Config

A file named `app.json`, `app.config.json`, `app.config.js`, or `app.config.ts` in the root of a project directory. [Learn more](configuration.md).

This file is used for the following purposes:

- Configuring how [Expo CLI](#expo-cli) works.
- Generating a project's public [manifest](#manifest) in EAS Update (think index.html but for native apps).
- Adding Expo [Config Plugins](#config-plugin) and configuring how `npx expo prebuild` generates native code.

### Expo Export

Refers to the command `npx expo export` from [Expo CLI](#expo-cli). This command is used to bundle the application JavaScript and assets, then export them into a static folder that can be uploaded to a hosting service like [EAS Update](#eas-update), and embedded in a [native runtime](#native-runtime) for offline use.

### Expo Go

The iOS and Android app that runs React Native apps. When you want to run your app outside of the Expo Go app and deploy it to the App and/or Play stores, you can build a [Standalone App](#standalone-app).

### Expo Install

Refers to the command `npx expo install` from [Expo CLI](#expo-cli). This command is used to install npm packages containing [native modules](#native-module) that work with the currently installed version of `expo` in the project. Not all packages are supported. This command wraps the globally installed [package managers](#package-manager).

### Expo Module Config

A file named `expo-module.config.json` that lives in the root directory of a [native module](#native-module). For more information, see [Module Config](/modules/module-config/).

### Expo SDK

A collection of [npm](#npm) packages containing [native modules](#native-module) that provides access to device/system functionality such as camera, push notification, contacts, file system, and more.

- Each package supports iOS, Android, and web whenever possible.
- The interface is completely written in [TypeScript](#typescript).
- All packages in the Expo SDK work with each other and can safely be compiled together.
- Any package in the SDK can be used in any [React Native](#react-native) app, with minimal, shared setup. [Learn more](/bare/installing-expo-modules/).
- All packages are [open source](https://github.com/expo/expo/tree/main/packages) and can be freely customized. Many popular community React Native packages started as forks of packages in the Expo SDK.

### Expo Start

Refers to the command `npx expo start` from [Expo CLI](#expo-cli). This command is used to start a local [development server](#development-server) that a [client](#expo-client) connects to in order to interact with the [Metro bundler](#metro-bundler).

### ExpoKit

> Deprecated technology

ExpoKit is an Objective-C and Java library that allows you to use the [Expo SDK](#expo-sdk) and platform and your existing Expo project as part of a larger standard native project — one that you would normally create using Xcode, Android Studio, or `react-native init`. [Read more](../expokit/eject.md).

**Support for ExpoKit ended after SDK 38. Expo modules can implement support for custom native configuration, and projects that need even more custom native code can [expose their Android Studio and Xcode projects with `npx expo prebuild`](/workflow/customizing/).**

### Fabric

The React Native rendering system that is used to create and manage native views. This package supports [iOS](#ios) and [Android](#android). For more information, see [Fabric Renderer](https://reactnative.dev/architecture/fabric-renderer).

### Flipper

A mobile app debugger. We do not enable Flipper in the default [Prebuild](#prebuild) template due to instability concerns. For more information, see [Flipper documentation](https://fbflipper.com/).

### FYI

Sometimes referred to as "Expo FYI", this is a collection of tailored solutions to complex issues that lives at [expo.fyi](https://expo.fyi/). FYI links are utilized throughout Expo's developer tooling to help provide a better developer experience to users.

### Global Expo CLI

The package `expo-cli` which was installed globally on the user's machine and used across all projects. This CLI was introduced in SDK 30 (2018), and deprecated in favor of the [Local Expo CLI](#local-expo-cli) in SDK 46 (2022).

### Gradle

Gradle is a build automation tool for multi-language software development. It controls the development process in the tasks of compilation and packaging to testing, deployment, and publishing.

### Hermes Engine

A [JavaScript engine](#javascript-engine) developed by [Meta](#meta) for use with [React Native](#react-native). Hermes uses Bytecode to improve startup time. Hermes is better at debugging than [JavaScriptCore](#javascriptcore-engine) as it implements parts of the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

### iOS

The operating system used on iPhone, iPad, and Apple TV. [Expo Go](#expo-go) currently runs on iOS for iPhone and iPad.

### JavaScript Engine

A native package that can evaluate JavaScript on-device. In React Native we often use [JavaScriptCore](#javascript-engine). Other options include [Hermes](#hermes-engine) by [Meta](#meta), and V8 by Google.

### JavaScriptCore Engine

A [JavaScript engine](#javascript-engine) developed by Apple and built-in to [iOS](#ios). React for [Android](#android) also uses a version of JavaScriptCore for parity. Debugging with JavaScriptCore is less sophisticated than V8 or [Hermes](#hermes-engine) which implement the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

### Linking

Linking can mean [deep linking into apps similar to how you link to websites on the web](linking.md) or [autolinking](#autolinking).

### Local Expo CLI

The package `@expo/cli` which is installed with the `expo` package. This is sometimes referred to as the "Versioned Expo CLI" because it is installed inside of the user's project as opposed to the now deprecated `expo-cli` which was installed globally.

### Manifest

An Expo app manifest is similar to a [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) - it provides information that Expo Go needs to know how to run the app and other relevant data. [Read more in "Expo Go"](/workflow/expo-go#manifest).

### Meta

Formerly Facebook, Meta is the group that develops [React Native](#react-native), [Metro Bundler](#metro-bundler), [Hermes Engine](#hermes-engine), [Yoga](#yoga) and more. The Expo team collaborates with Meta to deliver the best possible developer experience.

### Metro Bundler

The bundler used for converting JavaScript files and assets into a format that runs on a native client. This bundler is maintained by [Meta](#meta) and used exclusively for React Native apps. [Learn more](https://facebook.github.io/metro).

### Metro Config

The `metro.config.js` file used to configure [Metro bundler](#metro-bundler). This should extend the package `@expo/metro-config` when using [Expo CLI](#expo-cli). For more information, see [Customizing Metro](/guides/customizing-metro.md).

### Monorepo

A project that has multiple sub-projects which are all linked together via the package manager. A monorepo is a great way to link custom native packages to your application.

### Native Directory

The React Native ecosystem has thousands of libraries. Without a purpose-built tool, it's hard to know what the libraries are, to search through them, to determine the quality, try them out, and filter out the libraries that won't work for your project (some don't work with Expo, some don't work with Android or iOS). [React Native Directory](https://reactnative.directory/) is a website that aims to solve this problem, we recommend you use it to find packages to use in your projects.

### Native Module

A module written in native code that exposes native platform functionality to the JavaScript engine via the JS global. This functionality is usually accessed via `import { NativeModules } from 'react-native';`.

### Native Runtime

A native application containing a [JavaScript engine](#javascript-engine), and is capable of running a React application. This includes [Expo Go](#expo-go), [dev clients](#dev-clients), [standalone apps](#standalone-app), and even web browsers like Chrome.

### npm

[npm](https://www.npmjs.com/) is a package manager for JavaScript and the registry where the packages are stored. An alternative package manager, which we use internally at Expo, is [yarn](#yarn).

### Package Manager

Automates the process of installing, upgrading, configuring, and removing libraries, also known as dependencies, from your project. See [npm](#npm) and [yarn](#yarn).

### Platform extensions

Platform extensions are a feature of the [Metro bundler](#metro-bundler) which enable users to substitute files on a per-platform basis given a specific filename. For example, if a project has a `./index.js` file and a `./index.ios.js` file, then the `index.ios.js` will be used when bundling for iOS, and the `index.js` file will be used when bundling for all other platforms.

By default, platform extensions are resolved in `@expo/metro-config` using the following formula:

- iOS: `*.ios.js`, `*.native.js`, `*.js`
- Android: `*.android.js`, `*.native.js`, `*.js`
- Web: `*.web.js`, `*.js`

{/* TODO: Multi-Resolution Asset Extensions */}

### Prebuild

The process of generating the temporary native `/ios` and `/android` folders for a React Native project based on the [Expo Config](#expo-config). This process is performed by running the command `npx expo prebuild` from [Expo CLI](#expo-cli) in a project directory.

See also:

- [Prebuild template](#prebuild-template).
- [Autolinking](#autolinking).

### Prebuild Template

The React Native project template that is used as the first step of [Prebuilding](#prebuild). This template is versioned with the [Expo SDK](#expo-sdk), and the template is chosen based on the installed version of `expo` in a project. After the template is cloned, `npx expo prebuild` will evaluate the [Expo Config](#expo-config) and run the [Config mods](#config-mods) which modify various files in the template.

Although the template can be changed by using the `npx expo prebuild --template /path/to/template` flag, the default prebuild template contains important initial defaults that the `npx expo prebuild` command makes assumptions about.

The default template currently lives here: [`expo-template-bare-minimum`](https://github.com/expo/expo/tree/main/templates/expo-template-bare-minimum).

### Publish

We use the word "publish" as a synonym for "deploy". When you publish an app, it becomes available at a persistent URL from Expo Go, or in the case of [Standalone apps](#standalone-app), it updates the app.

### React Native

"React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components." [Read more](https://reactnative.dev/).

### React Native Web

A high-performing abstraction on top of `react-dom` which enables core primitives from [React Native](#react-native) to run in the browser. React Native for web (also known as RNW) was developed at Twitter and is currently used for their main website https://twitter.com. [Expo SDK](#expo-sdk) and [Expo CLI](#expo-cli) have first-class support for RNW.

### React Navigation

The preferred navigation library for React Native apps, developed and sponsored by the Expo team.

### Remote Debugging

Remote Debugging (also known as Async Chrome Debugging) is an experimental system for debugging React Native apps. The system works by executing the application JavaScript in a Chrome tab's web worker, then sending native commands over websockets to the native device. The benefit being you could use the built-in Chrome break points and network inspector to debug your application. This system does not work with JSI's synchronous calls, meaning it's not a reliable way to debug modern React Native apps. A better alternative to debugging React Native is to use [Hermes](#hermes-engine) as you can connect Chrome Dev Tools to it.

### Shell app

> Deprecated technology

Another term we occasionally use for [Standalone app](#standalone-app).

### Simulator

An emulator for iOS devices that you can run on macOS (or in [Snack](#snack)) to work on your app without having to have a physical device handy.

### Slug

We use the word "slug" in [app.json](#appjson) to refer to the name to use for your app in its url. For example, the [Native Component List](https://expo.dev/@community/native-component-list) app lives at https://expo.dev/@community/native-component-list and the slug is native-component-list.

### Snack

[Snack](https://snack.expo.dev/) is an in-browser development environment where you can build Expo [experiences](#experience) without installing any tools on your phone or computer.

### Software Mansion

A development agency in Krakow, Poland. Maintainers of `react-native-gesture-handler`, `react-native-screens`, and `react-native-reanimated`. The platform team at Expo is compromised of a number of contractors from Software Mansion. All of Software Mansion's core React Native libraries are supported in [Expo Go](#expo-go).

### Standalone app

An application binary that can be submitted to the iOS App Store or Android Play Store. [Read more in "Building Standalone Apps"](../distribution/building-standalone-apps.md).

### Store Config

The `store.config.json` file used to configure [EAS Metadata](#eas-metadata). This file can be generated from an existing App Store entry using `eas metadata:pull`.

### Sweet API

The Swift and Kotlin API for writing React Native modules. This API is provided by the library `expo-modules-core` which is shipped with the `expo` package. For more information, see [Module API](/modules/module-api/).

### TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. The Expo SDK is written in TypeScript, we highly recommend using it. For more information, see our [TypeScript guide](/guides/typescript/).

### Updates

Traditionally, apps for iOS and Android are updated by submitting an updated binary to the App and Play stores. Updates allow you to push an update to your app without the overhead of submitting a new release to the stores. For more information, see our [Publishing](publishing.md) documentation.

### VS Code Expo

The VS Code extension for improving the developer experience of working with Expo config files. This extension provides autocomplete and intellisense for the [Expo Config](#expo-config), [Store Config](#store-config), [Expo Module Config](#expo-module-config), and [EAS Config](#eas-config). For more information, see the [VS Code Expo extension](https://marketplace.visualstudio.com/items?itemName=byCedric.vscode-expo).

### Watchman

The file watcher used by [Metro](#metro-bundler) to perform hot reloads during development. Watchman contains native code and may cause issues when installing globally. Watchman is maintained by [Meta](#meta) and used in Jest.

### Webpack

The bundler used by [Expo CLI](#expo-cli) for developing [`react-native-web`](#react-native-web) apps.

### XDE

> Deprecated technology

XDE was a desktop tool with a graphical user interface (GUI) for working with Expo projects. It's been replaced by [Expo CLI](#expo-cli), which now provides both command line and web interfaces.

### yarn

A package manager for JavaScript. [Read more](https://yarnpkg.com/)

### Yarn Workspaces

The [monorepo](#monorepo) solution we recommend for Expo users. Yarn workspaces can be configured using the package [`expo-yarn-workspaces`](https://github.com/expo/expo/tree/main/packages/expo-yarn-workspaces).

### Yoga

A native cross-platform library used by React Native internally to provide FlexBox support to native views. React Native styles are passed to Yoga to layout and style elements on the screen. For more information, see [Yoga](https://github.com/facebook/yoga) documentation.
