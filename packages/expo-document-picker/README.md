# expo-document-picker

Provides access to the system's UI for selecting documents from the available providers on the user's device.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/document-picker.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/document-picker/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/document-picker/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-document-picker
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

### Plugin

In order to enable Apple iCloud storage in managed EAS builds, you'll need to define the `appleTeamId` property in the config plugin:

`app.json`

```json
{
  "ios": {
    "usesIcloudStorage": true,
    "bundleIdentifier": "com.yourname.yourapp"
  },
  "plugins": [
    [
      "expo-document-picker",
      {
        "appleTeamId": "YOUR_TEAM_ID"
      }
    ]
  ]
}
```

> Running `expo eject` will generate a the native project locally with the applied changes in your iOS Entitlements file.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
