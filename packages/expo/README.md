# expo

The `expo` package is a single package you can install in any React Native app to begin using Expo modules.

- includes core infrastructure for Expo modules: `expo-modules-core` and `expo-modules-autolinking`.
- bundles a minimal set of Expo modules that are required by nearly every app, such as `expo-asset`.
- provides [`@expo/cli`](https://github.com/expo/expo/blob/main/packages/%40expo/cli/README.md), a small CLI that provides a clean interface around both bundlers (such as Metro and Webpack) and native build tools (Xcode, Simulator.app, Android Studio, ADB, etc.), can generate native projects with `npx expo prebuild`, and aligns compatible package versions with `npx expo install`.
- exposes a JavaScript module that configures an app at runtime as needed to use `expo-font` and to function in Expo Go (optional, only if applicable).

See [CONTRIBUTING](./CONTRIBUTING.md) for instructions on working on this package.
