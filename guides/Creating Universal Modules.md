# Creating Universal Modules

Expo is moving towards a more extensible and configurable architecture, where different parts of the SDK can live with or without each others. We call those different parts of the SDK “Universal Modules”.

This rearchitecture will allow Expo users omit certain parts of the SDK they won't use, like face detector or GL.

If you're interested in that topic, check out [“Chopping Expo up into universal modules to take over the world” talk](https://youtu.be/-9CJZRv7uOY) by [Stanisław Chmiela (@sjchmiela)](https://github.com/sjchmiela), it should give you some more context why we're doing this and how is it implemented.

This guide will explain how to create a universal module and integrate it into Expo project.

#### Create the module

1. In your terminal, go to `packages` directory inside `expo` repository (`cd packages`).
2. Assuming you've got `expo-cli` package installed (`npm i -g expo-cli`), run `expo generate universal` to start the universal module generator.
3. It will guide you through the process, asking some questions about the modules, like a name:
  1. if you’re creating an implementation module (your code will actually do something, expose some functionality to client code, eg. barcode scanner), prefix hyphenated name of your module with `expo-`. (eg. `expo-barcode-scanner`).
  2. if you’re creating an interface module (one that will be a middle-ground between a consumer and provider), prefix hyphenated name of your module with `expo-` and end it with `-interface`. (eg. `expo-barcode-scanner-interface`)
  3. if you’re creating an adapter for a host platform (like React Native or Flutter), prefix hyphenated name of the platform with `@unimodules/` and end with `-adapter` (eg. `@unimodules/react-native-adapter`)
  4. Some areas of Expo SDK will be scoped on a name level, eg. for analytics we know we’ll have multiple providers, so we’ll name them `expo-analytics-branch`, `expo-analytics-segment`, etc.
  5. when it comes to Cocoapods name: `expo-module-name-something` => `EXModuleNameSomething`
  6. when it comes to Java module name:
    1. implementation module — `expo.modules.something`
    2. interface module — `org.unimodules.interfaces.something`
    3. platform adapter — `expo.adapters.something`
    4. scoped modules (eg. analytics) — `expo.modules.scope.something`, eg. `expo.modules.analytics.segment`
4. Great! You should have a new directory created in `packages` named properly.

#### Integrate with the native projects

1. You'll need to create a pull request adding your new module to [`xdl/src/modules/config.js`](https://github.com/expo/expo-cli/blob/master/packages/xdl/src/modules/config.js). Link your local changed XDL installation to `tools-public` or publish a canary release and update `xdl` version in `tools-public`. Thanks to this change your module will end up in `ios/Podfile` when you run `tools-public/generate-files-ios.js` and it will be versioned and put into `expokit-npm-package` when we version modules.
2. If you're extracting an existing Expo module from Expo monolith and would like it to be installed by default with `expo`, add `expo-your-module@^1.0.0` dependency to `packages/expo/package.json`. Then, run `yarn` in repository root.
3. Go to `tools-public` and run `./generate-files-ios.js`. It should update `Podfile`s with references to your new module. Run `pod install` in `ios`.
4. Go to `android` and add your new module entry to the array of other universal modules in `settings.gradle`.
5. If you want your module to be available in Expo Client:
  - edit `android/expoview/build.gradle` so that:
    - there is a commented out `compileOnly 'host.exp.exponent:expo-your-module:1.0.0'` under first `// Optional universal modules` (let's sort entries there)
    - there is an uncommented `api project(':expo-your-module')` entry under second `// Optional universal modules` (let's sort entries there too)
  - add your module's package to `ExperiencePackagePicker.java`. This file is planned to be undergo some major changes at the time of writing this guide, so just wing it.
6. If you want your module to also be available in standalone apps:
  - edit `android/app/build.gradle` so that there is a commented out `api 'host.exp.exponent:expo-your-module:1.0.0'` under `// Optional universal modules`
  - edit `expoPackages()` method in `MainActivity.java` so its return value includes your module's package too.
7. You're good to go! For available API options, check out existing universal modules and [documentation of `@unimodules/core`](https://github.com/unimodules/core).
