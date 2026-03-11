# 📱 expo-brownfield

`expo-brownfield` provides a toolkit and APIs for integrating Expo into existing native applications.

## API Documentation

<!-- TODO(pnleczek): Update link once 55 becomes latest -->
You can find the API documentation for the beta release in the [Expo documentation](https://docs.expo.dev/versions/v55.0.0/sdk/brownfield/).

## Installation in managed Expo projects

<!-- TODO(pnleczek): Update link and link title (to "stable release") once 55 becomes latest -->
For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the beta release](https://docs.expo.dev/versions/v55.0.0/sdk/brownfield/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

## Config plugin

Ensure that you have the `expo-brownfield` plugin included in your `app.json` or `app.config.js` file. You can pass additional configurations (such as iOS target name or Android library name) via the plugin options. If no extra options are added, defaults will be used.

```json
{
  "plugins": ["expo-brownfield"]
}
```

```json
{
  "plugins": [
    [
      "expo-brownfield",
      {
        "ios": {
          "targetName": "MyBrownfield"
        },
        "android": {
          "library": "mybrownfield"
        }
      }
    ]
  ]
}
```

## Configure for Android and iOS

Run `npx expo prebuild` after adding the plugin to your `app.json` file to generate the additional native targets for brownfield.

For projects that don't use CNG please follow the manual steps at [How to add Expo to an existing native (brownfield) app](https://docs.expo.dev/brownfield/get-started/). 

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
