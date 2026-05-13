# expo-age-range

A native module for age range functionality. Exposes [Play Age Signals API](https://developer.android.com/google/play/age-signals/use-age-signals-api) on Android and [Declared Age Range framework](https://developer.apple.com/documentation/declaredagerange/) on iOS.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/age-range/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/age-range/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#https://docs.expo.dev/versions/latest/sdk/age-range/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-age-range
```

Add `com.apple.developer.declared-age-range` entitlement according to [app.json / app.config.js docs](https://docs.expo.dev/versions/latest/config/app/#entitlements). Example:

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.developer.declared-age-range": true
      }
    }
  }
}
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
