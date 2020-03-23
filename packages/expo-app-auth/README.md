# expo-app-auth

Provides an interface with the OpenID library AppAuth

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/app-auth.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/app-auth/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-app-auth
```

### Configure for iOS

For iOS 10 and older, you need to set the supported redirect URL schemes in your `Info.plist`:

```plist
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.your.app.identifier</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.myapp.coolredirect</string>
    </array>
  </dict>
</array>
```

> If you use `com.myapp.coolredirect` then your `redirectUri`s should look something like `com.myapp.coolredirect:/oauthredirect`

- `CFBundleURLName` a globally unique string. Usually you want to use your app iOS bundle identifier.
- `CFBundleURLSchemes` an array of URL schemes your app can accept. The scheme is the prefix to your OAuth redirect URL.

### Configure for Android

When the auth request is complete it will redirect to your native app. For this to work you need to add a redirect scheme. This is similar to setting up deep-linking.

In your `android/app/build.gradle`:

```groovy
android {
  defaultConfig {
    // ...
    manifestPlaceholders = [
      // This is the prefix for your OAuth redirect URL
      // Note: it doesn't need to match the Android package name.
      appAuthRedirectScheme: 'com.myapp.coolredirect'
    ]
  }
}
```

> If you use `com.myapp.coolredirect` then your `redirectUri`s should look something like `com.myapp.coolredirect:/oauthredirect`

For more customization (like https redirects) please refer to the native docs: [capturing the authorization redirect](https://github.com/openid/AppAuth-android#capturing-the-authorization-redirect).

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
