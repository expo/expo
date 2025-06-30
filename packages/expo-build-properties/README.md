# expo-build-properties

**`expo-build-properties`** is a [config plugin](https://docs.expo.dev/config-plugins/introduction/) to customize native build properties when using [`npx expo prebuild`](https://docs.expo.dev/workflow/prebuild/).

## API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/build-properties/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/build-properties/)

### Installation

```
npx expo install expo-build-properties
```

Add plugin to `app.json`. For example:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 31,
            "targetSdkVersion": 31,
            "buildToolsVersion": "31.0.0"
          },
          "ios": {
            "deploymentTarget": "13.0"
          }
        }
      ]
    ]
  }
}
```

## iOS Build Properties

### Experimental Features

#### `ios.usePrebuiltReactNativeDependencies` (boolean, iOS only, experimental)

If set to `true`, this enables experimental support for prebuilt React Native iOS dependencies (ReactNativeDependencies.xcframework) by setting `ENV['RCT_USE_RN_DEP'] = '1'` in the Podfile. This can speed up iOS builds and reduce dependency-related build issues. See the [React Native 0.80 release blog post](https://reactnative.dev/blog/2025/06/12/react-native-0.80#experimental---react-native-ios-dependencies-are-now-prebuilt) for more details.

**Example:**

```json
{
  "ios": {
    "usePrebuiltReactNativeDependencies": true
  }
}
```

> **Warning:** This feature is experimental and may change or be removed in future releases.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide][https://github.com/expo/expo#contributing].
