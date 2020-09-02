# expo-auth-session

`AuthSession` is the easiest way to implement web browser based authentication (for example, browser-based OAuth flows) to your app, built on top of [expo-web-browser](https://www.npmjs.com/package/expo-web-browser).

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/auth-session.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/auth-session)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/auth-session).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-auth-session
```

### Configuration

To use this module, you need to set up React Native deep linking in your application. For more information, check out [React Native documentation](https://reactnative.dev/docs/linking).

#### Add support for React Native deep linking

- **Android**:

  Add intent filter and set the `launchMode` of your MainActivity to `singleTask` in `AndroidManifest.yml`:

  ```xml
  <activity
      android:name=".MainActivity"
      android:launchMode="singleTask">
      <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <!-- Accepts URIs that begin with "example://gizmos” -->
          <data android:scheme="example"
              android:host="gizmos" />
      </intent-filter>
  ```

  For more information about the available configuration, check out [Android documentation](https://developer.android.com/training/app-links/deep-linking#adding-filters).

* **iOS**:

  Add following lines to your `AppDelegate.m`:

  ```obj-c
  #import <React/RCTLinkingManager.h>

  // iOS 9.x or newer
  - (BOOL)application:(UIApplication *)application
              openURL:(NSURL *)url
              options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
  {
      return [RCTLinkingManager application:application openURL:url options:options];
  }

  // iOS 8.x or older
  - (BOOL)application:(UIApplication *)application
              openURL:(NSURL *)url
    sourceApplication:(NSString *)sourceApplication
           annotation:(id)annotation
  {
      return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
  }
  ```

  Add following lines to `Info.plist`:

  ```xml
  <dict>
      ...
      <key>CFBundleURLTypes</key>
      <array>
          <dict>
              <key>CFBundleURLName</key>
              <string>gizmos</string>
              <key>CFBundleURLSchemes</key>
              <array>
                  <string>example</string>
              </array>
          </dict>
      </array>
  </dict>
  ```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
