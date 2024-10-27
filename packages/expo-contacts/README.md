<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/contacts/">
    <img
      src="../../.github/resources/expo-contacts.svg"
      alt="expo-contacts"
      height="64" />
  </a>
</p>

Provides access to the phone's system contacts.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/contacts/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/contacts/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/contacts/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-contacts
```

### Configure for Android

Add `android.permission.READ_CONTACTS` and optionally `android.permission.WRITE_CONTACTS` permissions to your manifest (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.WRITE_CONTACTS" />
```

### Configure for iOS

Add `NSContactsUsageDescription` key to your `Info.plist`:

```xml
<key>NSContactsUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your contacts</string>
```

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
