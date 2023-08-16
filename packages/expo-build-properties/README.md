# expo-build-properties

**`expo-build-properties`** is a [config plugin](https://docs.expo.dev/config-plugins/introduction/) to customize native build properties when using [`npx expo prebuild`](https://docs.expo.dev/workflow/prebuild/).

## API documentation

- [Documentation for the main branch][docs-main]
- [Documentation for the latest stable release][docs-stable]

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
            "buildToolsVersion": "31.0.0",
            "flipper": true
          },
          "ios": {
            "deploymentTarget": "13.0",
            "flipper": true
          }
        }
      ]
    ]
  }
}
```

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide][../../contributing.md].

[docs-main]: https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/build-properties.mdx
[docs-stable]: https://docs.expo.dev/versions/latest/sdk/build-properties/
[contributing]: https://github.com/expo/expo#contributing
[config-plugins]: https://docs.expo.dev/config-plugins/introduction
