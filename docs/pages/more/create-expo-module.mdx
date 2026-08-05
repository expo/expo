---
title: create-expo-module
maxHeadingDepth: 4
description: A command-line tool to create and update Expo modules.
---

import { FileTree } from '~/ui/components/FileTree';
import { Terminal } from '~/ui/components/Snippet';
import { BoxLink } from '~/ui/components/BoxLink';

`create-expo-module` is a command-line tool to create a new Expo module or add platform support to an existing one. It can create a local module inside an Expo app, or a standalone module with an example app for developing and testing native code.

## Local and standalone modules

`create-expo-module` can create two types of modules: local modules and standalone modules.

A **local module** lives inside a single Expo project. Use a local module when you want to add custom native code to one app and do not need to publish or share it as a separate package. Local modules use the app's dependencies and tooling, and they are automatically discovered by Expo Autolinking from the project's native modules directory.

A **standalone module** is its own package. Use a standalone module when you want to reuse the module across multiple apps, keep it in a monorepo package, or publish it to npm. Standalone modules include package metadata, their own dependencies and scripts, and an example app for developing and testing the module.

## Create a local module

To create a local module inside an existing Expo project, navigate to the project directory and run the following command:

<Terminal
  cmd={{
    npm: ['$ npx create-expo-module@latest --local'],
    yarn: ['$ yarn create expo-module --local'],
    pnpm: ['$ pnpm create expo-module --local'],
    bun: ['$ bun create expo-module --local'],
  }}
/>

Running the above command will prompt you to enter the local module name, native module name, target platforms, and feature examples to include.

Local modules are created in the **modules** directory by default. If your project's **package.json** defines `expo.autolinking.nativeModulesDir`, the module is created in that directory instead.

A local module includes the module config, JavaScript or TypeScript source files, and native files for the selected platforms. For example, a module with Android and Apple support includes:

<FileTree
  files={[
    ['modules/my-module/'],
    ['modules/my-module/android/'],
    ['modules/my-module/ios/'],
    ['modules/my-module/src/'],
    ['modules/my-module/expo-module.config.json'],
  ]}
/>

## Create a standalone module

To create a standalone Expo module, run the following command:

<Terminal
  cmd={{
    npm: ['$ npx create-expo-module@latest my-module'],
    yarn: ['$ yarn create expo-module my-module'],
    pnpm: ['$ pnpm create expo-module my-module'],
    bun: ['$ bun create expo-module my-module'],
  }}
/>

Running the above command will prompt you for the package name, native module name, target platforms, feature examples, package metadata, and package manager. It generates the module and an **example** app that you can use to build and test the module on Android and iOS.

The generated module includes package metadata, TypeScript configuration, native platform files, module source files, and an **example** app. For example, a module with Android and Apple support includes:

<FileTree
  files={[
    ['my-module/'],
    ['my-module/android/'],
    ['my-module/ios/'],
    ['my-module/src/'],
    ['my-module/example/'],
    ['my-module/expo-module.config.json'],
    ['my-module/package.json'],
  ]}
/>

If the module is not created inside an existing Git repository, the command initializes a new Git repository and creates an initial commit.

When the **example** app is created, the command installs dependencies and runs Prebuild for the app. On macOS, it also installs CocoaPods for the generated iOS project.

## Develop a standalone module

After creating a standalone module, navigate to the module directory and open the generated native projects:

<Terminal
  cmd={{
    npm: ['$ cd my-module', '$ npm run open:android', '$ npm run open:ios'],
    yarn: ['$ cd my-module', '$ yarn open:android', '$ yarn open:ios'],
    pnpm: ['$ cd my-module', '$ pnpm run open:android', '$ pnpm run open:ios'],
    bun: ['$ cd my-module', '$ bun run open:android', '$ bun run open:ios'],
  }}
/>

> **Note:** The `open:ios` script requires macOS and Xcode. On Windows, open the generated **android** directory in Android Studio.

Then start the development server from the **example** directory:

<Terminal cmd={['$ cd example', '$ npx expo start']} cmdCopy="cd example && npx expo start" />

Standalone modules include the following scripts:

| Script         | Description                                          |
| -------------- | ---------------------------------------------------- |
| `build`        | Compiles TypeScript source files.                    |
| `clean`        | Removes generated build output.                      |
| `test`         | Runs module tests.                                   |
| `prepare`      | Builds package targets before publishing or packing. |
| `open:ios`     | Opens the generated iOS example project.             |
| `open:android` | Opens the generated Android example project.         |

When you change native code, rebuild the example app to see the changes. JavaScript and TypeScript changes are picked up by the development server.

## Options

Use the following options to customize the command's behavior.

### `[path]`

Creates the module at the provided path. If omitted, the command uses the name from the prompt.

### `--local`

Creates a local module inside the current Expo project. Local modules skip installing module dependencies and do not create an example app.

### `--platform`

Selects the platforms the module should support. Available values are `android`, `apple`, and `web`.

For local modules, the interactive prompt preselects platforms from the app config's [`platforms`](/versions/latest/config/app/#platforms) property when it is available. For standalone modules, all platforms are preselected by default. In non-interactive mode, all platforms are used unless this option is provided.

For example, to create an Android and Apple module:

<Terminal cmd={['$ npx create-expo-module@latest my-module --platform android apple']} />

### `--features`

Selects which feature examples to include in the generated module. Feature examples are small, working snippets in the generated files that show how to define common Expo Modules API features. They are meant to give you a starting point for your own implementation, not to declare what your module is allowed to support.

Available feature examples are:

| Feature         | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `Constant`      | Adds a native constant exported by the module.                                     |
| `Function`      | Adds a synchronous native function.                                                |
| `AsyncFunction` | Adds an asynchronous native function.                                              |
| `Event`         | Adds a module-level event emitter example.                                         |
| `View`          | Adds a native view component example.                                              |
| `ViewEvent`     | Adds an event emitted from the native view. This also includes the `View` example. |
| `SharedObject`  | Adds an example of a native object shared with JavaScript.                         |

For example:

<Terminal cmd={['$ npx create-expo-module@latest my-module --features Function AsyncFunction']} />

Use `all` to include every feature example:

<Terminal cmd={['$ npx create-expo-module@latest my-module --features all']} />

If you do not select any feature examples, the command creates a minimal module.

### `--full-example`

Includes all available feature examples. This is equivalent to passing `--features all`.

### `--package-manager`

Selects the package manager used for standalone modules. Available values are `npm`, `pnpm`, `yarn`, and `bun`.

If omitted, the command detects the package manager from the current process or from the package managers available on your system. In interactive mode, the detected package manager is preselected.

### `--no-example`

Skips creating the **example** app for a standalone module.

### `--barrel`

Generates an **index.ts** barrel file for local modules. This option only applies with `--local`.

By default, local modules do not generate a barrel file, so imports point directly to files in the module's **src** directory.

### `--source`

Uses a local template directory instead of downloading **expo-module-template** from npm. Pass the root directory of an **expo-module-template** package.

### `--with-readme`

Includes a **README.md** file in a standalone module.

### `--with-changelog`

Includes a **CHANGELOG.md** file in a standalone module.

### `--name`

Sets the native module name, for example `MyModule`. If the name conflicts with an Apple framework, the command renames it to avoid native build errors.

### `--description`

Sets the module description used in package metadata.

### `--package`

Sets the Android package name, for example `expo.modules.mymodule`.

### `--author-name`

Sets the package author name.

### `--author-email`

Sets the package author email address.

### `--author-url`

Sets the package author profile URL.

### `--repo`

Sets the package repository URL.

### `--license`

Sets the package license. The default is `MIT`.

### `--module-version`

Sets the initial package version. The default is `0.1.0`.

### `--version`

Prints the version number and exits.

### `--help`

Prints the list of available options and exits.

## Non-interactive mode

`create-expo-module` skips prompts when it runs in a non-interactive environment. This includes CI, `EXPO_NONINTERACTIVE`, and terminals where stdin is not a TTY.

In non-interactive mode, values that are not passed explicitly are filled with defaults and printed as warnings. For example, the command can derive the package name from the target path and use defaults for the native module name, Android package name, description, license, and initial version.

Pass options explicitly when you need stable generated values:

<Terminal
  cmd={[
    '$ npx create-expo-module@latest my-module --name MyModule --package expo.modules.mymodule --platform android apple --features Function AsyncFunction --description "My module" --license MIT --module-version 0.1.0',
  ]}
/>

For local modules, non-interactive mode also defaults to all platforms unless `--platform` is provided.

The `add-platform-support` command requires `--platform` in non-interactive mode:

<Terminal cmd={['$ npx create-expo-module@latest add-platform-support --platform android']} />

## Add platform support

The `add-platform-support` command adds new platform files to an existing Expo module and updates **expo-module.config.json**.

> **Note:** The command scans the existing native module definition and tries to detect feature examples such as `Function`, `AsyncFunction`, `View`, and `SharedObject`. Feature detection is best effort. It works well for modules that follow the usual Expo Modules API patterns, but it may not detect features correctly in unusual modules, modules with generated code, or large modules with definitions spread across multiple files. Use `--features` to override the detected feature examples.

For native modules, the existing implementation needs to use the Expo Modules API DSL so the command can find the module definition file. Older module formats are not supported.

Run the command from the module root:

<Terminal cmd={['$ npx create-expo-module@latest add-platform-support']} />

The command will prompt you to choose from the platforms that are not already supported by the module.

You can also pass the path to the module:

<Terminal cmd={['$ npx create-expo-module@latest add-platform-support ./packages/my-module']} />

The command only adds platforms that are not already listed in **expo-module.config.json**. It does not overwrite existing native platform directories, such as **android** or **ios**.

### `add-platform-support --platform`

Selects the platforms to add. Available values are `apple`, `android`, and `web`.

In non-interactive mode, this option is required. In interactive mode, the command prompts you to choose from the platforms that are not already supported by the module.

For example, to add Android support without a prompt:

<Terminal cmd={['$ npx create-expo-module@latest add-platform-support --platform android']} />

### `add-platform-support --features`

Overrides the feature examples used when generating files for the new platform.

If the generated files do not match your module, pass `--features` explicitly:

<Terminal
  cmd={[
    '$ npx create-expo-module@latest add-platform-support --platform android --features Function Event',
  ]}
/>

If no features are detected or provided, the command generates a minimal scaffold for the new platform.

### `add-platform-support --source`

Uses a local template directory instead of downloading **expo-module-template** from npm.

## Template versions

By default, `create-expo-module` downloads **expo-module-template** from npm.

Standalone modules use the latest template. Local modules try to use the template version that matches the Expo SDK version installed in the current project, and fall back to the latest template when the SDK version cannot be detected.

To test beta releases, set `EXPO_BETA=1` before running the command:

<Terminal cmd={['$ EXPO_BETA=1 npx create-expo-module@latest my-module']} />

## Environment variables

### `EXPO_BETA`

Uses the next version of the module and example app templates.

### `EXPO_DEBUG`

Enables debug logs for the command.

### `EXPO_NO_TELEMETRY`

Disables telemetry.

### `EXPO_NONINTERACTIVE`

Runs the command in non-interactive mode and skips prompts.

## Learn more

<BoxLink
  title="Expo Modules API: Get started"
  description="Learn how to create and use local and standalone Expo modules."
  href="/modules/get-started/"
/>

<BoxLink
  title="expo-module.config.json"
  description="Understand the module configuration file used by Expo Autolinking."
  href="/modules/module-config/"
/>

<BoxLink
  title="How to use a standalone Expo module"
  description="See how to use standalone modules in monorepos and publish them to npm."
  href="/modules/use-standalone-expo-module-in-your-project/"
/>
