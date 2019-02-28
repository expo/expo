# expo-web-browser

Provides access to the system's web browser and supports handling redirects. On iOS, it uses SFSafariViewController or SFAuthenticationSession, depending on the method you call, and on Android it uses ChromeCustomTabs. As of iOS 11, SFSafariViewController no longer shares cookies with the Safari, so if you are using WebBrowser for authentication you will want to use WebBrowser.openAuthSessionAsync, and if you just want to open a webpage (such as your app privacy policy), then use WebBrowser.openBrowserAsync.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/webbrowser.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/webbrowser/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-web-browser
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXWebBrowser', path: '../node_modules/expo-web-browser/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-web-browser'
project(':expo-web-browser').projectDir = new File(rootProject.projectDir, '../node_modules/expo-web-browser/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-web-browser')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.expo.modules.webbrowser.WebBrowserPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new WebBrowserPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
