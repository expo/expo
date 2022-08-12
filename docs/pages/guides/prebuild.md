---
title: Prebuild
---

import { Terminal } from '~/ui/components/Snippet';

Before a native app can be compiled, the native source code must be generated. Expo CLI provides a unique and powerful system called _prebuilding_, which generates the native code for your project based on four factors:

1. The [Expo Config][expo-config] file (`app.json`, `app.config.js`).
2. Arguments passed to the `npx expo prebuild` command.
3. Version of `expo` that's installed in the project.
4. Expo [Autolinking](/workflow/glossary-of-terms#autolinking), which finds native modules in your `package.json` and automatically links them as CocoaPods on iOS and Gradle packages on Android.

## Usage

Prebuild can be used by running:

<Terminal cmd={[
'$ npx expo prebuild',
]} cmdCopy="npx expo prebuild" />

This creates the `ios/` and `android/` folders for running your React code. If you modify the generated directories manually then you risk losing your changes the next time you run `npx expo prebuild --clean`. Instead, you should create [Expo Config Plugins][config-plugins] which modify the native directories safely during prebuild.

We highly recommend using Prebuild for the reasons listed in the [pitch](#pitch) section, but the system is [fully optional](#optionality) and you can stop using it at any time.

## Platforms

Prebuild currently supports iOS and Android, web support is not required as the analogous native app is the web browser. You can build for individual platforms by using the `--platform` flag:

<Terminal cmd={[
'$ npx expo prebuild --platform ios',
]} cmdCopy="npx expo prebuild --platform ios"/>

## Dependencies

Prebuild requires specific packages and versions are used in order to ensure the template works. The packages are inferred from the `dependencies` field in the [template](#templates) `package.json` file.

You can skip changing npm package versions with the `--skip-dependency-update` flag:

<Terminal cmd={[
'$ npx expo prebuild --skip-dependency-update react-native,react',
]} cmdCopy="npx expo npx expo prebuild --skip-dependency-update react-native,react"/>

## Package Manager

When the [dependencies](#dependencies) are changed, prebuild will reinstall packages using the inferred package manager that is currently used in the project. Specific package managers can be used by providing one of: `--npm`, `--yarn`, `--pnpm`.

All installation can be skipped by passing the `--no-install` command, this is useful for testing generation quickly.

## Clean

The `--clean` flag will clear any existing native directories before generating, this is the safest way to use the prebuild command, but it's also the slowest to recompile as you clear some generated project caches.

When you re-run `npx expo prebuild`, it layers changes on top of your existing files to make rebuilding the native app faster. This is purely for convenience and starts to breakdown when your project utilizes a lot of "dangerous modifiers" for performing changes like adding regex changes to application code.

Due to the pivotal nature of the flag, you'll be warned to have a clean git status when the `--clean` flag is used. This prompt is optional and will be skipped when encountered in CI.

If you'd like, you can disable the check by enabling the environment variable `EXPO_NO_GIT_STATUS=1`.

The purpose of the prompt is to encourage managed workflow users to add the `/ios` and `/android` folders to the project's `.gitignore`, ensuring that the project is always managed. However, this can make custom config plugins harder to develop so we haven't introduced any mechanism to enforce this behavior.

Advanced projects may need to swap between workflows often, building custom functionality natively in Xcode and Android Studio, then moving that functionality into local Config Plugins, and repeating. As the Expo Config Plugin ecosystem matures, the need to develop plugins like this will be drastically reduced.

<!-- It is also theoretically possible to make clean builds take seconds rather than minutes, meaning `--clean` could become the default behavior in the future. -->

## Templates

You can customize how the native folders are generated while remaining in the managed workflow by building [Expo Config Plugins][config-plugins]. Many config plugins already exist for lots of modifications. You can see the [list][config-plugins-repo] for more information.

Prebuild generates template files before modifying them with Expo Config Plugins. The template files are versioned and come from the npm package [`expo-template-bare-minimum`][template]. You can change the template used by passing `--template /path/to/template.tgz` to the `npx expo prebuild` command. This is not recommended as the base modifiers in `@expo/prebuild-config` make some undocumented assumptions about the template files.

## Side-Effects

As of SDK 46, `npx expo prebuild` has some unfortunate side-effects that we plan to remove. Ideally, running `npx expo prebuild` would only generate an `ios` and `android` folder but this is currently not the case.

In addition to generating the native folders, prebuild also makes the following modifications:

- Generating a `metro.config.js` file.
- Generating an `index.js` file.
- Removing the `main` field in the `package.json`.
- Modifying the `scripts` field in the `package.json`.
- Modifying the `dependencies` field in the `package.json`.

The convenience change to the `scripts` field is the only thing that alters how a user develops their app before/after prebuild, all other changes can be left as-is if desired.

## Optionality

Prebuilding is completely optional and does not disqualify a project from using other features or services offered by Expo. We created the designation _bare workflow_ to refer projects that do not use `npx expo prebuild`.

Everything offered by Expo including [EAS][eas], Expo CLI, and the libraries in the Expo SDK are built to **fully support** the _bare workflow_ as this is a minimum requirement for supporting projects using `npx expo prebuild`.

The main exception is the [Expo Go][expo-go] app which has partial support for the _bare workflow_, given the project in question only utilizes native features that are already available in the Expo Go app.

We develop new [Native Modules][native-modules] without using `npx expo prebuild` as it's currently the fastest way to do so. However, we recommend users building apps with Expo attempt to use Prebuild as much as possible for the reasons listed in the [pitch](#pitch) section.

## Pitch

A single native project on its own is very complicated to maintain, scale, and grow. In a cross-platform app, you have multiple native projects that you must maintain and keep them up to date. We created the _optional_ Expo Prebuild system to streamline this process. Below are a few issues we've identified with native development and some corresponding reasons we believe Expo Prebuild solves these issues.

### Sensible upgrades

Building native code requires a basic familiarity with that native platform's default tooling leading to a fairly difficult learning curve. In cross-platform, this curve is multiplied by the amount of platforms you wish to develop for. Cross-platform tooling doesn't solve this issue if you need to drop down and implement many features individually, instead it often creates a harder system for developing apps.

When you bootstrap a native app, it has a bunch of preset values and code that you don't need to understand in order to get started. Eventually you'll want to upgrade your native application and now you'll need to be acutely familiar with how all of the initial code works in order to safely upgrade it. This is extremely challenging and users will either upgrade their app incorrectly, missing crucial changes, or they'll bootstrap a new app and copy all of their source code into the new application.

**With Prebuild** upgrading is much closer to upgrading a pure JavaScript application. Simply bump the versions in your `package.json` and regenerate the native project.

### Cross-platform configuration

Cross-platform configuration like the app icon, name, splash screen, and so on must be implemented manually in native code. These are often implemented very differently across platforms.

**With Prebuild** cross-platform configuration is handled at the Config Plugin level and the user often just has to set a single value like `"icon": "./icon.png"` to have all icon generation taken care of.

### Dependency side-effects

Most complex native packages have additional setup required. For example, a camera library requires permission settings be added to the iOS `Info.plist` and the Android `AndroidManifest.xml` file. This additional setup can be considered a disjointed side-effect of a package. Pasting required side-effect code into your project's native files can lead to difficult native compilation errors. It's also hard for library authors to document every possible combination of code blocks to paste.

**With Prebuild** library authors, who know how configure their library better than anyone, can create a testable and versioned script (Expo Config Plugin) to automate adding the required configuration side-effects. This means library side-effects can be more expressive, powerful, and stable. For native code side-effects, we also provide: [AppDelegate Subscribers](/modules/appdelegate-subscribers) and [Android Lifecycle Listeners](/modules/android-lifecycle-listeners) which come standard in the default [Prebuild template](#templates).

### Orphaned code

When you uninstall a package you have to be certain you removed all of the side-effects required to make that package work. If you miss anything, it leads to orphaned code that you cannot trace back to any particular package, this code builds up and makes your project harder to understand and maintain.

**With Prebuild** the only side-effect is the Config Plugin entry in a project's Expo config (`app.json`), which will fail to evaluate when the corresponding package has been uninstalled, meaning it's nearly impossible to create orphaned configuration.

## Anti Pitch

Here are some reasons _Expo Prebuilding_ might **not** be the right fit for a particular project. There are also some notes on how we plan on alleviating the existing drawbacks eventually.

### React Native versioning

`npx expo prebuild` generates native code based on the version of `expo` a project has installed, so a project with SDK 46 (`expo@46.0.0`) would generate a `react-native@0.69.4` app.

Expo has a quarterly release cycle, whereas `react-native` releases major versions at random intervals, with stability patches following a few weeks after. This means there are times where you cannot use `npx expo prebuild` with the latest release of React Native. This could potentially be circumvented by using a custom [Prebuild template](#templates), but this is not recommended.

If React Native moves to a more predictable and stable release schedule then we could potentially add support during a beta release period.

### Platform compatibility

Prebuild can only be used for native platforms that are supported by the Expo SDK. This means iOS and Android for the time being. With the exception of web, which doesn't require `npx expo prebuild` since it uses the browser instead of a custom native runtime.

We plan to support more platforms in the future, but team size and limited resources prevent us from being able to maintain them at the moment. The stability of out-of-tree platforms like `react-native-macos` and `react-native-windows` are also considered.

You can still use prebuild for your `ios`, and `android` projects but any extra platforms will have to be configured manually in the meantime.

### Standard native development is slower

All native changes must be added with Expo Modules Core and Config Plugins. This means if you want to add some quick native file to your project the old fashion way, then your better off adding the file manually and working your way back into the system via a monorepo (we recommend [expo-yarn-workspaces](https://www.npmjs.com/package/expo-yarn-workspaces)). We plan to speed this process up by adding functionality to Expo Autolinking that finds project native files outside of the native folders and links them before building.

If you want to do something like modifying the gradle properties file, you'll have to write a plugin for that [example](https://github.com/expo/expo/blob/1c994bb042ad47fbf6878e3b5793d4545f2d1208/apps/native-component-list/app.config.js#L21-L28). Of course this could be easily automated with helper plugin libraries, but it is a bit slower if you need to do it often.

### Config Plugin support

Not all packages support _Expo Prebuilding_ yet. If you find a library that requires extra setup after installation and doesn't have an Expo Config Plugin, you should open a PR or an issue so that the maintainer is aware of the feature request.

Some packages like [`react-native-blurhash`](https://github.com/mrousavy/react-native-blurhash) don't require any additional native setup so they don't even need a Config Plugin!

Other packages like [`react-native-ble-plx`](https://github.com/Polidea/react-native-ble-plx) do require additional setup and therefore require a Config Plugin to be used with `npx expo prebuild` (in this case there's an external plugin called [`@config-plugins/react-native-ble-plx`](https://github.com/expo/config-plugins/tree/main/packages/react-native-ble-plx)).

Alternatively, we also have a repo for [out-of-tree Expo Config Plugins][config-plugins-repo] which provides plugins for popular packages that haven't adopted the system yet. Think of this like [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) for TypeScript. We prefer packages ship their own Expo Config Plugin to ensure versioning is always aligned, but if they haven't adopted the system yet, the community can easily get unblocked using the packages listed in the repo.

[config-plugins-repo]: https://github.com/expo/config-plugins
[template]: https://github.com/expo/expo/tree/main/templates/expo-template-bare-minimum
[native-modules]: /workflow/glossary-of-terms/#native-module
[eas]: /eas
[expo-go]: https://expo.dev/expo-go
[config-plugins]: /guides/config-plugins/
[expo-config]: /workflow/configuration/
