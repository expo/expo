<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/ui/">
    <img
      src="../../.github/resources/expo-ui.svg"
      alt="expo-ui"
      height="64" />
  </a>
</p>

A set of native input components that let you build interfaces with Jetpack Compose on Android and SwiftUI on iOS, from React.

## Main features

- Real native components. Jetpack Compose on Android, SwiftUI on iOS — not reimplementations.
- The JavaScript API mirrors the native API. Component, prop, and event names match the platform.
- Three tiers, so you can pick how much platform detail you want to handle.
- Modifiers stay modifiers, from `@expo/ui/swift-ui/modifiers` and `@expo/ui/jetpack-compose/modifiers`.

## The three tiers

### Platform (low-level)

```js
import { ... } from '@expo/ui/swift-ui';
import { ... } from '@expo/ui/jetpack-compose';
```

One export per platform, each mapping directly onto the underlying native component. Use these when you want the full SwiftUI or Jetpack Compose surface and are willing to write a `.ios` and `.android` file.

### Universal

```js
import { ... } from '@expo/ui';
```

Cross-platform components that run on Android, iOS, and web from one source. Each one is built on top of the platform tier — a universal `Switch` renders a SwiftUI `Toggle` on iOS and a Jetpack Compose `Switch` on Android — so you write once and still get the native experience. This is the tier to start with.

### Drop-in replacements

```js
import { ... } from '@expo/ui/community/...';
```

API-compatible replacements for popular React Native community libraries, backed by the same native components. Swapping the import is usually the whole migration.

| Replaces                                            | Import from                            |
| --------------------------------------------------- | -------------------------------------- |
| `@gorhom/bottom-sheet`                              | `@expo/ui/community/bottom-sheet`      |
| `@react-native-community/datetimepicker`            | `@expo/ui/community/datetime-picker`   |
| `@react-native-community/slider`                    | `@expo/ui/community/slider`            |
| `@react-native-masked-view/masked-view`             | `@expo/ui/community/masked-view`       |
| `@react-native-menu/menu`                           | `@expo/ui/community/menu`              |
| `@react-native-picker/picker`                       | `@expo/ui/community/picker`            |
| `@react-native-segmented-control/segmented-control` | `@expo/ui/community/segmented-control` |
| `react-native-pager-view`                           | `@expo/ui/community/pager-view`        |

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/ui/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/ui/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install @expo/ui
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional setup necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for notes specific to this package.
