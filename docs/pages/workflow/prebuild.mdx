---
title: Prebuild
---

import { Terminal } from '~/ui/components/Snippet';

Before a native app can be compiled, the native source code must be generated. Expo CLI provides a unique and powerful system called _prebuild_, which generates the native code for your project based on four factors:

1. The [Expo Config][expo-config] file (`app.json`, `app.config.js`).
2. Arguments passed to the `npx expo prebuild` command.
3. Version of `expo` that's installed in the project and its corresponding [prebuild template](#templates).
4. [Autolinking][autolinking], for linking [native modules][native-modules] found in the `package.json`.

## Usage

Prebuild can be used by running:

<Terminal cmd={[
'$ npx expo prebuild',
]} cmdCopy="npx expo prebuild" />

This creates the `ios/` and `android/` folders for running your React code. If you modify the generated directories manually then you risk losing your changes the next time you run `npx expo prebuild --clean`. Instead, you should create ["config plugins"][config-plugins] — functions that perform modifications on native projects during prebuild.

We highly recommend using prebuild for the reasons listed in the [pitch](#pitch) section, but the system is [fully optional](#optionality) and you can stop using it at any time.

### Usage with EAS Build

You can configure EAS Build to run `npx expo prebuild` before building by using the "managed" preset ([learn more](/build-reference/ios-builds/)).

### Usage with Expo CLI run commands

You can perform a native build locally by running:

<Terminal cmd={[
'# Build your native Android project',
'$ npx expo run:android',
'',
'# Build your native iOS project',
'$ npx expo run:ios'
]} />

If native build directories are not present `npx expo prebuild` will be run one time for the specific platform you wish to run. On subsequent uses of the run commands, you will need to manually run `npx expo prebuild` to ensure the native code is freshly synchronized with your local configuration.

## Platform support

Prebuild currently supports iOS and Android. Web support is not required because there is no native project to generate for web — the app it runs in is always your web browser. You can build for individual platforms by using the `--platform` flag:

<Terminal cmd={[
'$ npx expo prebuild --platform ios',
]} cmdCopy="npx expo prebuild --platform ios"/>

## Dependencies

The first step in prebuild is to initialize new native projects from a template. There is a template for each Expo SDK version, and each Expo SDK version corresponds to a specific version of React and React Native. The React and React Native versions in your project will be updated to the versions used in the `dependencies` field in the [template](#templates) `package.json`, if they are not already the same.

You can skip changing npm package versions with the `--skip-dependency-update` flag:

<Terminal cmd={[
'$ npx expo prebuild --skip-dependency-update react-native,react',
]} cmdCopy="npx expo prebuild --skip-dependency-update react-native,react"/>

## Package managers

When the [dependencies](#dependencies) are changed, prebuild will reinstall packages using the package manager that is currently used in the project (this is inferred from the lockfile). You can force a specific package manager by providing one of: `--npm`, `--yarn`, `--pnpm`.

All installation can be skipped by passing the `--no-install` command, this is useful for testing generation quickly.

## Clean

The `--clean` flag will delete any existing native directories before generating.

When you re-run `npx expo prebuild` without the `--clean` flag, it layers changes on top of your existing files. This is faster than re-generating from scratch, but it may not produce the exact same results in some cases. For example, not all config plugins are idempotent — when your project utilizes a lot of "dangerous modifiers" for performing changes like adding regex changes to application code, this can sometimes lead to unexpected behavior. This is why using the `--clean` flag is the safest way to use the prebuild command and it is generally recommended in most cases.

Due to the destructive nature of the flag, you'll be warned to have a clean git status when the `--clean` flag is used. This prompt is optional and will be skipped when encountered in CI.

If you'd like, you can disable the check by enabling the environment variable `EXPO_NO_GIT_STATUS=1`.

The purpose of the prompt is to encourage managed workflow users to add the `/ios` and `/android` folders to the project's `.gitignore`, ensuring that the project is always managed. However, this can make custom config plugins harder to develop so we haven't introduced any mechanism to enforce this behavior.

There are cases where developers may want to swap between workflows often. For example, you may want to build custom functionality natively in Xcode and Android Studio, and then move that functionality into local config plugins.

{/* It is also theoretically possible to make clean builds take seconds rather than minutes, meaning `--clean` could become the default behavior in the future. */}

## Templates

You can customize how the native folders are generated while remaining in the managed workflow by building ["config plugins"][config-plugins]. Many config plugins already exist for lots of modifications. You can [see a list of some popular plugins][config-plugins-repo] for more information.

Prebuild generates template files before modifying them with config plugins. The template files are based on the Expo SDK version and come from the npm package [`expo-template-bare-minimum`][template]. You can change the template used by passing `--template /path/to/template.tgz` to the `npx expo prebuild` command. This is not generally recommended because the base modifiers in `@expo/prebuild-config` make some undocumented assumptions about the template files, and so it may be tricky to maintain your custom template.

## Side effects

As of SDK 46, `npx expo prebuild` performs several side effects outside of generating the `ios/` and `android/` directories. Work is in progress to eliminate these side effects — ideally, running `npx expo prebuild` would generate the iOS and Android projects and leave the rest of the project untouched.

In addition to generating the native folders, prebuild also makes the following modifications:

- Generates a `metro.config.js` file (if it doesn't exist).
- Generates an `index.js` file (if it doesn't exist).
- Removes the `main` field in the `package.json`.
- Modifies the `scripts` field in the `package.json`.
- Modifies the `dependencies` field in the `package.json`.

The convenience change to the `scripts` field is the only side effect that alters how a developer works on their app before/after prebuild. All other changes can be left in place and committed to git to minimize the diff when running prebuild, if desired.

## Optionality

Prebuilding is completely optional and it works great with all tools and services offered by Expo. We created the designation _bare workflow_ to refer projects that do not use `npx expo prebuild` — projects where developers make direct changes to their native projects, rather than continuously generating them on demand as with prebuild.

Everything offered by Expo including [EAS][eas], Expo CLI, and the libraries in the Expo SDK are built to **fully support** the _bare workflow_ as this is a minimum requirement for supporting projects using `npx expo prebuild`. The only exception is the [Expo Go][expo-go] app, which can load _bare workflow_ projects, but only if they are structured to provide JavaScript fallbacks for native code that does not exist in the Expo Go runtime.

## Pitch

A single native project on its own is complicated to maintain, scale, and grow. In a cross-platform app, you have multiple native projects that you must maintain and keep up to date for the latest operating system releases and to avoid falling too far behind in any third party dependencies. We created the _optional_ Expo Prebuild system to streamline this process. Below are a few issues we've identified with native development in the context of React Native and some corresponding reasons we believe Expo Prebuild solves these issues.

> Prebuild can be used in any React Native project. Read more in [adopting prebuild](/guides/adopting-prebuild).

### Sensible upgrades

Building native code requires a basic familiarity with that native platform's default tooling leading to a fairly difficult learning curve. In cross-platform, this curve is multiplied by the amount of platforms you wish to develop for. Cross-platform tooling doesn't solve this issue if you need to drop down and implement many features individually in platform-specific native code.

When you bootstrap a native app, there is a bunch of code and configuration that you don't need to understand in order to get started. But you now own it. Eventually, you will want to upgrade your native application and now you'll need to be familiar with how all of the initial code works in order to safely upgrade it. This is extremely challenging and users often either upgrade their app incorrectly, missing crucial changes, or they'll bootstrap a new app and copy all of their source code into the new application.

**With Prebuild** upgrading is much closer to upgrading a pure JavaScript application. Bump the versions in your **package.json** and regenerate the native project.

### Cross-platform configuration

Cross-platform configuration like the app icon, name, splash screen, and so on must be implemented manually in native code. These are often implemented very differently across platforms.

**With Prebuild** cross-platform configuration is handled at the config plugin level, and the developer only needs to set a single value like `"icon": "./icon.png"` to have all icon generation taken care of.

### Dependency side effects

Many complex native packages require additional setup beyond installing and [autolinking][autolinking]. For example, a camera library requires permission settings be added to the iOS `Info.plist` and the Android `AndroidManifest.xml` file. This additional setup can be considered a configuration side effect of a package. Pasting required side effect code into your project's native files can lead to difficult native compilation errors, and it's also code that you now own and maintain.

**With Prebuild** library authors, who know how to configure their library better than anyone, can create a testable and versioned script called a [config plugin][config-plugins], to automate adding the required configuration side effects for their library. This means library side effects can be more expressive, powerful, and stable. For native code side effects, we also provide: [AppDelegate Subscribers](/modules/appdelegate-subscribers) and [Android Lifecycle Listeners](/modules/android-lifecycle-listeners) which come standard in the default [prebuild template](#templates).

### Orphaned code

When you uninstall a package you have to be certain you removed all of the side effects required to make that package work. If you miss anything, it leads to orphaned code that you cannot trace back to any particular package, this code builds up and makes your project harder to understand and maintain.

**With Prebuild** the only side effect is the [config plugin][config-plugins] in a project's Expo config (**app.json**), which will throw an error when the corresponding node module has been uninstalled, meaning a lot less orphaned configuration.

## Anti-pitch

Here are some reasons _Expo Prebuilding_ might **not** be the right fit for a particular project.

### React Native versioning

`npx expo prebuild` generates native code based on the version of `expo` a project has installed, so a project with SDK 46 (`expo@46.0.0`) would generate a `react-native@0.69.5` app.

Expo releases a new version approximately every quarter, and `react-native` does not follow a calendar based release schedule. This means there are times where you cannot use `npx expo prebuild` with the latest release of React Native. This could potentially be circumvented by using a custom [prebuild template](#templates) if you are willing to experiment. You can also mitigate this by cherry-picking any changes you need from the latest version of React Native into a fork and using that in your project.

### Platform compatibility

Prebuild can only be used for native platforms that are supported by the Expo SDK. This means iOS and Android for the time being. With the exception of web, which doesn't require `npx expo prebuild` since it uses the browser instead of a custom native runtime.

In the future, we would like to support additional platforms, such as `react-native-macos` and `react-native-windows`, but this is not currently a priority.

If you are targeting additional platforms, you can still use prebuild for your `ios`, and `android` projects — any extra platforms will have to be configured manually in the meantime.

### Making changes directly is quicker than modularizing and automating

All native changes must be added with native modules (using React Native's built-in Native Module APIs or the Expo Modules API) and config plugins. This means if you want to quickly add a native file to your project to experiment, then you may be better off running prebuild and adding the file manually, then working your way back into the system with a [monorepo](https://docs.expo.dev/guides/monorepos/). We plan to speed this process up by adding functionality to [Expo Autolinking](/workflow/glossary-of-terms#expo-autolinking) that finds project native files outside of the native folders and links them before building.

If you want to modify configuration, such as the **gradle.properties** file, you'll have to write a plugin ([example](https://github.com/expo/expo/blob/1c994bb042ad47fbf6878e3b5793d4545f2d1208/apps/native-component-list/app.config.js#L21-L28)). This can be easily automated with helper plugin libraries, but it is a bit slower if you need to do it often.

### Config plugin support in the community

Not all packages support _Expo Prebuilding_ yet. If you find a library that requires extra setup after installation and doesn't yet have a config plugin, we recommend opening a pull request or an issue so that the maintainer is aware of the feature request.

Many packages, such as [`react-native-blurhash`](https://github.com/mrousavy/react-native-blurhash), don't require any additional native configuration beyond what is handled by [autolinking][autolinking] and so no config plugin is required.

Other packages, such as [`react-native-ble-plx`](https://github.com/Polidea/react-native-ble-plx), do require additional setup and therefore require a config plugin to be used with `npx expo prebuild` (in this case there's an external plugin called [`@config-plugins/react-native-ble-plx`](https://github.com/expo/config-plugins/tree/main/packages/react-native-ble-plx)).

Alternatively, we also have a repo for [out-of-tree config plugins][config-plugins-repo] which provides plugins for popular packages that haven't adopted the system yet. Think of this like [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) for TypeScript. We prefer packages ship their own config plugin, but if they haven't adopted the system yet, the community can use the packages listed in the repo.

[config-plugins-repo]: https://github.com/expo/config-plugins
[template]: https://github.com/expo/expo/tree/main/templates/expo-template-bare-minimum
[native-modules]: /workflow/glossary-of-terms/#native-module
[autolinking]: /workflow/glossary-of-terms#autolinking
[eas]: /eas
[expo-go]: https://expo.dev/expo-go
[config-plugins]: /guides/config-plugins/
[expo-config]: /workflow/configuration/
