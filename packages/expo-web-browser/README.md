# expo-web-browser

Provides access to the system's web browser and supports handling redirects. On iOS, it uses SFSafariViewController or SFAuthenticationSession, depending on the method you call, and on Android it uses ChromeCustomTabs. As of iOS 11, SFSafariViewController no longer shares cookies with Safari, so if you are using WebBrowser for authentication you will want to use WebBrowser.openAuthSessionAsync, and if you just want to open a webpage (such as your app privacy policy), then use WebBrowser.openBrowserAsync.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/webbrowser.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/webbrowser/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/webbrowser/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-web-browser
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
