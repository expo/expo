---
title: Prebuild
---

import { Terminal } from '~/ui/components/Snippet';

Before a native app can be compiled, the native source code must be generated. Expo CLI provides a unique and powerful system called _prebuilding_, which generates the native code for your project based on four factors:

1. The [Expo Config][expo-config] file (`app.json`, `app.config.js`).
2. Arguments passed to the `npx expo prebuild` command.
3. Version of `expo` that's installed in the project.
4. Expo Autolinking, which finds native modules in your `package.json` and automatically links them as CocoaPods on iOS and Gradle packages on Android.

## Usage

Prebuild can be used by running:

<Terminal cmd={[
'$ npx expo prebuild',
]} />

This creates the `ios/` and `android/` folders for running your React code. If you modify the generated directories manually then you risk losing your changes the next time you run `npx expo prebuild --clean`. Instead, you should create [Expo Config Plugins][config-plugins] which modify the native directories safely during prebuild.

You can stop using prebuild at anytime and continue developing your native app manually but we don't recommend this for the reasons listed in [philosophy](#philosophy).

## Platforms

Prebuild currently supports iOS and Android, web support is not required as the analogous native app is the web browser. You can build for individual platforms by using the `--platform` flag:

<Terminal cmd={[
'$ npx expo prebuild --platform ios',
]} />

## Dependencies

Prebuild requires specific packages and versions are used in order to ensure the template works. The packages are inferred from the `dependencies` field in the [template](#templates) `package.json` file.

You can skip changing NPM package versions with the `--skip-dependency-update` flag:

<Terminal cmd={[
'$ npx expo prebuild --skip-dependency-update react-native,react',
]} />

## Package Manager

When the [dependencies](#dependencies) are changed, prebuild will reinstall packages using the inferred package manager that is currently used in the project. Specific package managers can be used by providing one of: `--npm`, `--yarn`, `--pnpm`.

All installation can be skipped by passing the `--no-install` command, this is useful for testing generation quickly.

## Clean

The `--clean` flag will clear any existing native directories before generating, this is the safest way to use the prebuild command, but it's also the slowest to recompile as you clear some generated project caches.

When you re-run `npx expo prebuild`, it layers changes on top of your existing files to make rebuilding the native app faster. This is purely for convenience and starts to breakdown when your project utilizes a lot of "dangerous modifiers" for performing changes like adding regex changes to application code.

Due to the pivotal nature of the flag, you'll be warned to have a clean git status when the `--clean` flag is used. This prompt is optional and will be skipped when encountered in CI.

You can disable the check by enabling the environment variable `EXPO_NO_GIT_STATUS=1` if you'd like.

The purpose of the prompt is to encourage managed workflow users to add the `/ios` and `/android` folders to the project's `.gitignore`, ensuring that the project is always managed. This can however make custom config plugins harder to develop so we haven't introduced any mechanism to enforce this behavior.

Advanced projects may need to swap between workflows often, building custom functionality natively in Xcode and Android Studio, then moving it to project-level config plugins, and repeating. As the Expo Config Plugin ecosystem matures, the need to develop like plugins like this will be drastically reduced.

It is also theoretically possible to make clean builds take seconds rather than minutes, meaning `--clean` could become the default behavior in the future.

## Templates

You can customize how the native folders are generated while remaining in the managed workflow by building [Expo Config Plugins][config-plugins]. Many config plugins already exist for lots of modifications, you can find an [incomplete list here][config-plugins-repo].

Prebuild generates template files before modifying them with Expo Config Plugins. The template files are versioned and come from the NPM package [`expo-template-bare-minimum`][template]. You can change which template is used by passing `--template /path/to/template.tgz` to the `npx expo prebuild` command. This is not recommended as the base modifiers in `@expo/prebuild-config` make some undocumented assumptions about the template files.

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

Prebuilding is completely optional and does not disqualify a project from using other Expo features. We created the designation _bare workflow_ to refer projects that do not use `npx expo prebuild`.

Everything offered by Expo including [EAS][eas], Expo CLI, and the libraries in the Expo SDK are built to **fully support** the _bare workflow_ as this is a minimum requirement for supporting projects using `npx expo prebuild`.

The main exception is the [Expo Go][expo-go] app which has partial support for the _bare workflow_, given the project in question only utilizes native features that are already available in the Expo Go app.

We develop new [Native Modules][native-modules] without using `npx expo prebuild` as it's currently the fastest way to do so, however we recommend users building apps with Expo attempt to use prebuild as much as possible for the reasons listed in the [philosophy](#philosophy).

## Philosophy

A single native project on its own is very complicated to maintain, scale, and grow. In a cross-platform app, you have multiple native projects that you must maintain and keep updated. These aren't standard projects either, they have a custom native framework, React, installed -- adding to the complexity.

This quickly grows to become a massive technical debt. Here are a few reasons why:

- Cross-platform concepts like the app icon, name, splash screen, etc. must be implemented manually in native code, these are often implemented very differently across platforms.
- Building native code requires a basic familiarity with that native platform's default tooling leading to a fair learning curve. In cross-platform, this curve is multiplied by the amount of platforms you wish to develop for.
- Most complex native packages have additional setup required e.g. a camera library may require permission messages, event forwarding in the AppDelegate, custom XML, etc. This additional setup can be considered a side-effect that makes it harder to upgrade or uninstall a library. When you miss side-effects they become orphaned code that you cannot trace back to any particular package, this code builds up and makes your project harder to maintain.
- When you bootstrap a native app, it has a bunch of preset values and code that you don't need to understand in order to get started. Eventually you'll want to upgrade your native application and now you'll need to be acutely familiar with how all of the initial code works in order to safely upgrade it. This is extremely challenging and users will either upgrade their app incorrectly, missing crucial changes, or they'll bootstrap a new app and copy all of their source code into the new application.

These native development issues are crippling at scale, to combat them we created the `npx expo prebuild` command and [Expo Config Plugins][config-plugins]. if you aren't satisfied with how prebuild works you can simply develop your app without it and continue to utilize the rest of the Expo developer tools.

[config-plugins-repo]: https://github.com/expo/config-plugins
[template]: https://github.com/expo/expo/tree/main/templates/expo-template-bare-minimum
[native-modules]: /workflow/glossary-of-terms/#native-module
[eas]: /eas
[expo-go]: https://expo.dev/expo-go
[config-plugins]: /guides/config-plugins/
[expo-config]: /workflow/configuration/
