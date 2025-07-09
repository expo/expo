<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/network/">
    <img
      src="../../.github/resources/expo-network.svg"
      alt="expo-network"
      height="64" />
  </a>
</p>
Gets device's network information such as ip address, mac address and check for airplane mode.

See [Expo Network docs](https://docs.expo.dev/versions/latest/sdk/network/) for documentation of this universal module's API.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/network/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/network/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/network/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-network
```

### Configure for Android

This module requires permissions to access the network and Wi-Fi state. The `ACCESS_NETWORK_STATE` and `ACCESS_WIFI_STATE` permissions are added automatically.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
