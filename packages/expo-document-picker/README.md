<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/document-picker/">
    <img
      src="../../.github/resources/expo-document-picker.svg"
      alt="expo-document-picker"
      height="64" />
  </a>
</p>

Provides access to the system's UI for selecting documents from the available providers on the user's device.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/document-picker.mdx)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/document-picker/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/document-picker/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-document-picker
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

### Plugin

You can change the `com.apple.developer.icloud-container-environment` entitlement using the `iCloudContainerEnvironment` property.

`app.json`

```json
{
  "ios": {
    "usesIcloudStorage": true,
    "bundleIdentifier": "com.yourname.yourapp"
  },
  "plugins": ["expo-document-picker"]
}
```

> Running `npx expo prebuild` will generate the [native project locally](https://docs.expo.dev/workflow/customizing/) with the applied changes in your iOS Entitlements file.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
