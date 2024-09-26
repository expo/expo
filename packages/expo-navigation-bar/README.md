# expo-navigation-bar

**`expo-navigation-bar`** enables you to modify and observe the native navigation bar on Android devices. Due to some Android platform restrictions, parts of this API overlap with the [`expo-status-bar`][status-bar] API.

Properties are named after style properties; visibility, position, backgroundColor, borderColor, etc.

## API documentation

- [Documentation for the latest stable release][docs-stable]
- [Documentation for the main branch][docs-main]

## Installation in managed Expo projects

For [managed][docs-workflows] Expo projects, please follow the installation instructions in the [API documentation for the latest stable release][docs-stable].

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package][unimodules] before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-navigation-bar
```

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide][contributing].

[docs-main]: https://docs.expo.dev/versions/unversioned/sdk/navigation-bar/
[docs-stable]: https://docs.expo.dev/versions/latest/sdk/navigation-bar/
[docs-workflows]: https://docs.expo.dev/archive/managed-vs-bare/
[contributing]: https://github.com/expo/expo#contributing
[unimodules]: https://github.com/expo/expo/tree/main/packages/react-native-unimodules
[status-bar]: https://github.com/expo/expo/tree/main/packages/expo-status-bar
