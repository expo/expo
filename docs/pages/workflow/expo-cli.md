---
title: Expo CLI
maxHeadingDepth: 4
---

import { Terminal } from '~/ui/components/Snippet';

The Expo CLI enables you to do the following:

- Start a server for developing your app: `npx expo start`.
- Bundle the JavaScript and assets for your app: `npx expo export`.
- Generate the native iOS and Android apps for your project: `npx expo prebuild`.
- Build and run the native app as standalone development clients: `npx expo run:ios` and `npx expo run:android`.
- Install npm packages that work with the version of `expo` in your project: `npx expo install package-name`.
- Log in to your Expo account to enable sandboxed features like local storage in the Expo Go app: `npx expo login`, `logout`, `register`, `whoami`.
- Evaluate the Expo config (**app.json**, or **app.config.js**): `npx expo config`.

> This documentation refers to the Local Expo CLI (SDK 46 and greater). For information on legacy Expo CLI, see [legacy Global Expo CLI](/archived/expo-cli/).

<hr />

To view a list of available commands in Expo CLI, run the following in your project:

<Terminal cmd={['$ npx expo -h']} />

> You can also run `yarn expo -h` if you prefer to use yarn as the package manager.

The output should look something like below:

```
  Usage
    $ npx expo <command>

  Commands
    start, export, export:web
    run:ios, run:android, prebuild
    install, customize, config
    login, logout, whoami, register

  Options
    --version, -v   Version number
    --help, -h      Usage info
```

You can run any command with the `--help` or `-h` flag to learn more about it:

<Terminal cmd={['$ npx expo login -h']} />

## Develop

Start a development server for developing your project by running:

<Terminal cmd={['$ npx expo start']} />

> You can also run `npx expo` as an alias to `npx expo start`.

This command starts a server on `http://localhost:19000` which a client can fetch from to interact with the bundler (the default bundler is [Metro](https://facebook.github.io/metro/)).

The UI that shows up is referred to as the **Terminal UI**.

The default UI has a QR code and a list of keyboard shortcuts you can press, these commands are only available in interactive terminals (not available in CI):

- `a`: Open the project in Expo Go on Android.
- `shift` + `a`: Select an Android device or emulator to open.

- `i`: Open the project in Expo Go on iOS.
- `shift` + `i`: Select an iOS Simulator to open.
- `w`: Open the project in a web browser. This may require Webpack to be installed in your project.

- `r`: Reload the app on any connected device.
- `m`: Open the dev menu on any connected native device (web not supported).
- `shift` + `m`: Choose more commands to trigger on connected devices. This includes toggling the performance monitor, opening the element inspector, reloading the device, and opening the dev menu.
- `j`: Open Chrome Dev Tools for any connected device that is using Hermes as the JavaScript engine. [Learn more](/guides/using-hermes/).
- `o`: Open project code in your editor. This can be configured with the `EXPO_EDITOR` and `EDITOR` environment variables.
- `c`: Show development server URL as a QR code in the terminal.
- `?`: Show all Terminal UI commands.

### Server URL

The URL is served over a LAN connection that utilizes the local network by default. You can change this behavior to localhost-only by using the flag `--host localhost` or `--localhost`.

- `--port`: Port to start the dev server on (does not apply to Webpack or `--tunnel` URLs). Default: **19000**.
- `--https`: Start the dev server using a secure origin. This is currently only supported in Webpack.

You can force the URL to be whatever you like by using the `EXPO_PACKAGER_PROXY_URL` environment variable.

For example:

<Terminal cmd={[
'export EXPO_PACKAGER_PROXY_URL=http://expo.dev',
'$ npx expo start'
]} />

Will open apps to: `exp://expo.dev:80` (the `:80` is a temporary workaround for Android support).

#### Tunneling

Sometimes you may find it difficult to connect your device to your machine. Many factors can cause this to happen: restrictive network conditions (common for public Wi-Fi), firewalls (common for Windows users), or Emulator misconfiguration.

To combat these, we provide built-in URL "tunneling" with ngrok for free! This enables you to forward your `localhost` URL to a public URL that's accessible from anywhere in the world (more on the security implications later).

This means your device simply needs to connect to the internet to access your dev server.

To enable tunneling, you first need `@expo/ngrok` installed either globally (recommended) or locally in your project:

<Terminal cmd={['$ npm i -g @expo/ngrok']} />

Then run the following in your project:

<Terminal cmd={['$ npx expo start --tunnel']} />

This will serve your app from a public URL like: `http://xxxxxxx.bacon.19000.exp.direct:80`.

**Drawbacks**

- Tunneling is slower than local connections because requests must be forwarded to a public URL.
- Tunnel URLs are public and can be accessed by anyone! We attempt to mitigate the risk of project exposure by:
  - Adding entropy to the beginning of the URL. This can be reset by clearing the `.expo` folder in your project.
  - Destroying the tunnel when the project stops.
- Tunnels require a network connection, meaning this feature cannot be used offline or with the `--offline` flag.

#### Offline

You can develop without a network connection by using the `--offline` flag:

<Terminal cmd={['$ npx expo start --offline']} />

This will prevent the CLI from attempting to make network requests (nominally faster DX). If you don't use the flag and your computer is offline, then offline support will automatically be enabled, it will just take a bit longer to verify the connection.

## Building

An Expo app consists of two parts: a native runtime, and static JavaScript files. The CLI provides commands for performing both tasks.

### Exporting

You can export the JavaScript and assets for your app using Metro bundler by running the following:

<Terminal cmd={[
'$ npx expo export',
]} />

This is done automatically when using `eas update` or when compiling the native runtime. The `export` command works similar to most web frameworks:

- A bundler transpiles and bundles your application code in "production" mode, stripping all code guarded by the `__DEV__` boolean.
- All static files are copied into a static `dist/` folder which can be served from a static host.
- Contents of the `public/` folder are copied into the `dist/` folder as-is.

The following options are provided:

- `--platform <platform>`: Choose the platform to compile for: 'ios', 'android', 'all'. **Default: all**. 'web' is also available if configured in the Expo config. For more information, see [Customizing Metro](/guides/customizing-metro).
- `--dev`: Bundle in 'development' mode without minifying code or stripping the `__DEV__` boolean.
- `--output-dir <dir>`: The directory to export the static files to. **Default: dist**
- `--max-workers <number>`: Maximum number of tasks to allow the bundler to spawn. Setting this to `0` will run all transpilation on the same process, meaning you can easily debug Babel transpilation.
- `-c, --clear`: Clear the bundler cache before exporting.

### Compiling

You can compile your app locally with the `run` commands:

<Terminal cmd={[
'# Build for iOS',
'$ npx expo run:ios',
'# Build for Android',
'$ npx expo run:android'
]} />

`expo run:ios` can only be run on a Mac, and Xcode must be installed. You can build the app in the cloud from any computer using `eas build -p ios`. Similarly, `expo run:android` requires Android Studio and Java to be installed and configured on your computer.

Building locally is useful for developing native modules and debugging complex native issues. Building remotely with `eas build` is often much more resilient due to the preconfigured environment.

If your project does not have the corresponding native folder, the prebuild will run once to generate the folder before building. For example, if your project does not have an `ios/` folder in the root directory, then running `npx expo run:ios` will first run `npx expo prebuild -p ios` before building your app. This folder can be treated as a temporary folder, and you can add it to your project's `.gitignore` to remain in the managed workflow. The native project can be regenerated with `npx expo prebuild --clean` at any time. Because the iOS build cache (also known as "derived data") folder lives outside of your project, you can `--clean` while retaining relatively fast rebuild times.

<!-- TODO: multi-platform setup guide -->

**Cross-Platform Arguments**

- `--no-build-cache`: Clear the native build cache before building. On iOS this is the "derived data" folder. This is useful for profiling your build times.
- `--no-install`: Skip installing dependencies. On iOS this will also skip running `npx pod-install` if the `dependencies` field in the project's `package.json` have changed.
- `--no-bundler`: Skip starting the dev server. This will automatically be activated if the dev server is serving the current app in a different tab.
- `-d, --device [device]`: Device name or ID to build the app is on. You can pass `--device` without arguments to select a device from a list of available options. This supports connected devices as well as virtual devices.
- `-p, --port <port>`: Port to start the development server. **Default: 8081**. This is only relevant for development builds. Production builds will "export" the project and embed the files in the native binary before installing.

#### Compiling iOS

An iOS app can have multiple "schemes" for things like App Clips, watchOS apps, Safari Extensions, and so on. By default, `expo run:ios` will choose the scheme for your application. You can pick a custom scheme with the `--scheme <my-scheme>` argument. If you pass in the `--scheme` alone, then you will be prompted to choose a scheme from the list of available options in your Xcode project.

The scheme you select can filter out which `--device` options show up in the selection prompt, for example, selecting an Apple TV scheme will only show available Apple TV devices.

You can compile the app for production by running:

<Terminal cmd={['$ npx expo run:ios --configuration Release']} />

This build is not guaranteed to be code signed for submission to the Apple App Store. This command should be used to test bugs that may only show up in production builds. Code signing requires several network requests and is prone to many different types of errors from the Apple servers. To generate a production build that is code signed for the App Store, we recommend using `eas build -p ios`.

When you compile your app onto a simulator, the Simulator's native error logs will be piped to the command line. This is useful for quickly seeing bugs that may cause a fatal error. This functionality is not available for apps that are built on physical iOS devices.

You can debug using `lldb` and all of the native Apple debugging tools by opening the project in Xcode and rebuilding from Xcode:

<Terminal cmd={['$ xed ios']} />

This is useful because you can set native breakpoints and profile any part of the application. Be sure to track changes in source control (git) in case you need to regenerate the native app with `npx expo prebuild -p ios --clean`.

#### Compiling Android

Android apps can have multiple different "variants" which are defined in the project's `build.gradle`. Variants can be selected with the `--variant` flag:

<Terminal cmd={['$ npx expo run:android --variant debug']} />

You can compile the Android app for production by running:

<Terminal cmd={['$ npx expo run:android --variant release']} />

This build is not guaranteed to be code signed for submission to the Google Play Store. This command should be used to test bugs that may only show up in production builds. To generate a production build that is code signed for the Play Store, we recommend using `eas build -p android`.

You can debug the project using native debugging tools by opening the `android/` folder in Android Studio:

<Terminal cmd={['$ open -a /Applications/Android\ Studio.app android']} />

### Exporting with Webpack

> Webpack is only supported for the Web platform.

You can export the JavaScript and assets for your web app using Webpack by running the following:

<Terminal cmd={[
'$ npx expo export:web',
]} />

- `--dev`: Bundle in 'development' mode without minifying code or stripping the `__DEV__` boolean.
- `-c, --clear`: Clear the bundler cache before exporting.

This command will be disabled if your project is configured to use `metro` for bundling web projects in the `app.json` via the `expo.web.bundler: 'metro'` field.

## Prebuild

<Terminal cmd={[
'$ npx expo prebuild',
]} cmdCopy="npx expo prebuild" />

Native source code must be generated before a native app can compile. Expo CLI provides a unique and powerful system called _prebuild_, that generates the native code for your project.

**For more information:**

- [Prebuild](/workflow/prebuild)
- [Config plugins](/guides/config-plugins)
- [Native modules API](/modules/module-api)

## Telemetry

Expo dev tools collect anonymous data about general usage. This helps us know when a command is safe to deprecate (low usage), or when a feature is not working as expected. Telemetry is completely optional, and you can opt out by using the `EXPO_NO_TELEMETRY=1` environment variable.

## Authentication

Expo CLI provides authentication methods to use with the `npx expo start` command. Authentication is used to "code sign" manifests for secure OTA usage. Think of this like HTTPS on the web.

1. Register an account with `npx expo register`.
2. Login to your account with `npx expo login`.
3. Check which account is currently authenticated with `npx expo whoami`.
4. Logout with `npx expo logout`.

These credentials are shared across Expo CLI and EAS CLI.

## Customizing

Sometimes you may want to customize a project file that would otherwise be managed in memory by the CLI. When you utilize tools other than Expo CLI, you'll need to have the default config files present. Otherwise, your app may not work as expected. You can generate files by running:

<Terminal cmd={['$ npx expo customize']} />

From here, you can choose to generate basic project files like:

- `babel.config.js` -- The Babel configuration. This is required to be present if you plan to use tooling other than Expo CLI to bundle your project.
- `webpack.config.js` -- The default Webpack config for web development.
- `metro.config.js` -- The default Metro config for universal development. This is required for usage with the React Native community CLI.

## Environment Variables

- `EXPO_NO_WEB_SETUP` (**boolean**) prevents the CLI from forcing web dependencies (`react-dom`, `react-native-web`, `@expo/webpack-config`) to be installed before using web functionality. This is useful for cases where you wish to perform non-standard web development.
- `EXPO_NO_TYPESCRIPT_SETUP` (**boolean**) prevents the CLI from forcing TypeScript to be configured on `npx expo start`. For more information, see [TypeScript guide](/guides/typescript/).
- `DEBUG=expo:*` (**string**) enables debug logs for the CLI, you can configure this using the [`debug` convention](https://github.com/debug-js/debug#conventions).
- `EXPO_DEBUG` (**boolean**) an alias for `DEBUG=expo:*`.
- `EXPO_PROFILE` (**boolean**) enable profiling stats for the CLI, this does not profile your application.
- `EXPO_NO_CACHE` (**boolean**) disable all global caching. By default, Expo config JSON schemas, Expo Go binaries for simulators and emulators, and project templates are cached in the global `.expo` folder on your machine.
- `CI` (**boolean**) when enabled, the CLI will disable interactive functionality, skip optional prompts, and fail on non-optional prompts. Example: `CI=1 npx expo install --check` will fail if any installed packages are outdated.
- `EXPO_NO_TELEMETRY` (**boolean**) disables anonymous usage collection.
- `EXPO_NO_GIT_STATUS` (**boolean**) skips warning about git status during potentially dangerous actions like `npx expo prebuild --clean`.
- `EXPO_NO_REDIRECT_PAGE` (**boolean**) disables the redirect page for selecting an app, that shows when a user has `expo-dev-client` installed, and starts the project with `expo start` instead of `expo start --dev-client`.
- `EXPO_PUBLIC_FOLDER` (**string**) public folder path to use with Metro for web. Default: `public`. [Learn more](/guides/customizing-metro/).
- `EDITOR` (**string**) name of the editor to open when pressing `o` in the Terminal UI. This value is used across many command line tools.
- `EXPO_EDITOR` (**string**) an Expo-specific version of the `EDITOR` variable which takes higher priority when defined.
- `EXPO_IMAGE_UTILS_NO_SHARP` (**boolean**) disable the usage of global Sharp CLI installation in favor of the slower Jimp package for image manipulation. This is used in places like `npx expo prebuild` for generating app icons.
