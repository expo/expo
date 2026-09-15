# create-expo-module

Initializes a new [Expo module](https://docs.expo.dev/modules/overview/) project with scaffolding for iOS, Android, and TypeScript, along with an example project to interact with the module from within an app.

### Usage

```
yarn create expo-module
```

To test beta releases, run `EXPO_BETA=1 yarn create expo-module`.

### Local modules

Run the command from your Expo app's directory:

```sh
npx create-expo-module@latest my-module --local --platform apple android --features Function AsyncFunction
```

This version supports local modules in SDK 55 and later. For SDK 54 and earlier, use the SDK 55
CLI release:

```sh
npx create-expo-module@sdk-55 --local
```

Local modules are created in `modules/`, or the directory configured by
`expo.autolinking.nativeModulesDir` in the app's `package.json`. They use the app's dependencies
and tooling and do not have their own `package.json` or example app. Pass `--barrel` to generate
an `index.ts` for imports.

For SDK 55 apps, the CLI uses its modern template and generates SDK 55-compatible native code,
including SwiftUI and Compose features. The legacy `expo-module-template@sdk-55` tag remains
available for older CLIs. Standalone modules target the SDK associated with the CLI version.
If a downloaded template lacks SDK 55 compatibility data, generation stops and suggests the SDK 55
CLI instead of generating incompatible native code.

When selecting SwiftUI or Compose features, install `@expo/ui` in the app with
`npx expo install @expo/ui`. Rebuild the app with `npx expo run:ios` or `npx expo run:android`
after adding native code.

`--repo` sets repository metadata for standalone modules; it does not select the template and
has no effect with `--local`. To use a template directory from disk, pass `--source <directory>`.
