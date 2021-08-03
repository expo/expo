# expo-modules-core

The core of Expo Modules architecture.

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-modules-core
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

# Importing native dependencies - autolinking

React Native libraries come with platform-specific (native) code. This native code has to be linked into the project or
configured properly. These actions require some modifications to the native project files. One of the steps that have
to be done with the native configuration is to enable autolinking mechanism that takes care of including any supported
module's native code into the project. Below we preset the configuration that should be manually applied to the
project's native files.

### iOS

> Caution! After successful file modification you have to run `pod install` again.

```ruby
# Podfile

require File.join(`node --print "require.resolve('react-native/package.json')"`, "../scripts/react_native_pods")
require File.join(`node --print "require.resolve('@react-native-community/cli-platform-ios/package.json')"`, "../native_modules")
require File.join(`node --print "require.resolve('@unimodules/react-native-adapter/package.json')"`, "../scripts/autolinking")

#  ...

target "TargetName" do
  use_unimodules!
  config = use_native_modules!
  use_react_native!(:path => config["reactNativePath"])

  # ...
end
```

### Android

```groovy
// app/build.gradle

apply from: new File(["node", "--print", "require.resolve('react-native-unimodules/package.json')"].execute().text.trim(), "../gradle.groovy")
apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute().text.trim(), "../react.gradle")
apply from: new File(["node", "--print", "require.resolve('expo-updates/package.json')"].execute().text.trim(), "../scripts/create-manifest-android.gradle")

// ...

apply from: new File(["node", "--print", "require.resolve('@react-native-community/cli-platform-android/package.json"].execute().text.trim(), "../native_modules.gradle");
applyNativeModulesAppBuildGradle(project)
```

```groovy
// settings.gradle

apply from: new File(["node", "--print", "require.resolve('react-native-unimodules/package.json')"].execute().text.trim(), "../gradle.groovy");
includeUnimodulesProjects()

apply from: new File(["node", "--print", "require.resolve('@react-native-community/cli-platform-android/package.json"].execute().text.trim(), "../native_modules.gradle");
applyNativeModulesSettingsGradle(settings)
```

### Explanation

On both platforms the files you have to reference in the native projects are usually placed under the root
`node_modules` directory. However that's not always true, as libraries providing the scripts might be placed almost
anywhere in the project (monorepos edge case). In order to always properly reference the files we take advantage of
the NodeJS's dependency resolution strategy. We invoke subprocess that spawns the simple javascript script that tries
to locate the module providing the wanted scripts. On `iOS` we use [`` ` ` `` (backtick)](https://stackoverflow.com/questions/3159945/running-command-line-commands-within-ruby-script)
([alternative reference](https://ruby-doc.org/core-3.0.2/Kernel.html#method-i-60)) and on `Android` we use [String[]#execute](<http://docs.groovy-lang.org/latest/html/groovy-jdk/java/lang/String[].html#execute()>)
to obtain the results from the subprocess' stdout. The javascript that is spawned is using [`require.resolve` method](https://nodejs.org/dist/latest-v14.x/docs/api/modules.html#modules_require_resolve_request_options) to obtain the location
of `package.json` served by the dependency (if you look for the module location using solely module name, you'll be
given the path to the file pointed by the `main` attribute from the `package.json` and we need to know the location of
the module's root directory). Given that we easily build up the path to the desired script and execute it accordingly.
You can read more about the scripts and libraries used in the examples above in their official READMEs.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
