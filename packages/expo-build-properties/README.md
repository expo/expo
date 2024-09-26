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

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide][https://github.com/expo/expo#contributing].
