<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/sensors/">
    <img
      src="../../.github/resources/expo-sensors.svg"
      alt="expo-sensors"
      height="64" />
  </a>
</p>

Provides access to a hardware device's accelerometer, gyroscope, magnetometer, and pedometer.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/sensors/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/sensors/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-sensors
```

### Configure for Android

No additional set up necessary for basic usage.

**Note:** Starting in Android 12 (API level 31), the system has a 200ms limit for each sensor updates. If you need a update interval less than 200ms, you should add `<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS"/>` to **AndroidManifest.xml**.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

**Note:** to access DeviceMotion stats on iOS, the NSMotionUsageDescription key must be present in your Info.plist.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo/blob/main/CONTRIBUTING.md).
