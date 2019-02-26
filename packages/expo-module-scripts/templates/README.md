# ${packageName}

${description}
<!--- remove for interfaces --->

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/${docName}.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/${docName}/)

<!--- end remove for interfaces --->
# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install ${packageName}
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod '${podName}', path: '../node_modules/${packageName}/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':${packageName}'
project(':${packageName}').projectDir = new File(rootProject.projectDir, '../node_modules/${packageName}/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':${packageName}')
```
<!--- remove for interfaces --->

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.${androidPackagePath};
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new ${androidPackageName}()
), Arrays.<SingletonModule>asList());
```

<!--- end remove for interfaces --->
# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
