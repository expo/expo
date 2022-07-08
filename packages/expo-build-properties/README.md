# expo-build-properties

**`expo-build-properties`** is a config plugin for managed apps to override the default native build properties.

## API documentation

- [Documentation for the main branch][docs-main]
- [Documentation for the latest stable release][docs-stable]

### Installation

**Note:** To use this config plugin, your apps must be a managed app and build by either [EAS Build](/build/introduction.md) or `expo run:[android|ios]`.

```
expo install expo-build-properties
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

Contributions are very welcome! Please refer to guidelines described in the [contributing guide][contributing].

[docs-main]: https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/build-properties.md
[docs-stable]: https://docs.expo.dev/versions/latest/sdk/build-properties/
[contributing]: https://github.com/expo/expo#contributing
[config-plugins]: https://docs.expo.dev/guides/config-plugins/
