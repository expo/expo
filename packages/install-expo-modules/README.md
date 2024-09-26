<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>install-expo-modules</code>
</h1>

<p align="center">A tool for existing React Native projects to adopt <a href="https://docs.expo.dev/versions/latest/">expo-modules and SDK easier</a>.</p>

<!-- Body -->

# Usage

Just to run `install-expo-modules` command in your project:

```sh
npx install-expo-modules
```

After that, you can add other expo-modules you need, e.g. `expo-device`:

```sh
expo install expo-device
# the expo command is from expo-cli. if you don't have this, run `npm -g install expo-cli` to install.
```

# What did `install-expo-modules` do for your project

- Install [`expo`](https://www.npmjs.com/package/expo) package for necessary core and react-native autolinking.
- Modify your project files to adopt expo-modules. If your project is managed by `git`, you can use `git diff` to review whatever `install-expo-modules` do for you.
- Since expo-modules' minimal iOS version requirement may be higher than React Native core's, if your ios deployment target is lower, this tool will upgrade your deployment target.
- `pod install` at last to update linked modules for iOS.

# Contributing

To contribute a change and test it with a RNC CLI app, follow these steps:

1. `yarn watch` to start building the project in watch mode.
2. make your changes.
3. run `node path_to_expo/packages/install-expo-modules/build/index.js .` in your RNC CLI project.

Don't forget to write unit tests for your changes.
