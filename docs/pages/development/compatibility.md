---
title: Compatibility
---

The `expo-dev-client` library is only compatible with specific versions of certain Expo and React Native modules. If you find another incompatible library that isn't on this list, please [open an issue](https://github.com/expo/expo/issues/new?assignees=&labels=needs+review&template=dev_client_bug_report.yml) and let us know.

You do not need to use any of these packages in your project in order to use `expo-dev-client`, but if you do, you must use a compatible version.

## Expo SDKs

In a project with the `expo` package installed, running `npx expo install expo-dev-client` will always install the latest compatible version. For convenience, this table lists the highest minor version of `expo-dev-client` that is supported by various Expo SDK versions.

| Expo SDK | expo-dev-client |
| -------- | --------------- |
| SDK 46   | `1.2.X`         |
| SDK 45   | `1.0.X`         |
| SDK 44   | `0.8.X`         |
| SDK 43   | `0.8.X`         |
| SDK 42   | `0.7.X`         |

## react-native

| expo-dev-client | react-native        |
| --------------- | ------------------- |
| `1.2.X`         | `0.69.X`            |
| `1.1.X`         | `0.69.X`            |
| `1.0.X`         | `0.64.X` - `0.68.X` |
| `0.9.X`         | `0.64.X` - `0.68.X` |
| `0.8.X`         | `0.64.X`            |
| `0.7.X`         | `0.62.X` - `0.64.X` |
| `0.6.X`         | `0.62.X` - `0.63.X` |

## react-native-reanimated

All recent versions of `expo-dev-client` are compatible with `react-native-reanimated@2.2.0` and above.
