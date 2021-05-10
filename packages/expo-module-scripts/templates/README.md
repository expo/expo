# ${packageName}

${description}
<!--- remove for interfaces --->

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/${docName}.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/${docName}/)

<!--- end remove for interfaces --->
# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install ${packageName}
```

<!--- remove for no-ios --->
### Configure for iOS

Run `npx pod-install` after installing the npm package.

<!--- end remove for no-ios --->

<!--- remove for no-android --->
### Configure for Android

<!--- remove for interfaces --->

<!--- remove for no-package --->
No additional setup necessary.

<!--- end remove for no-package --->
<!--- end remove for interfaces --->
<!--- end remove for no-android --->
# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
