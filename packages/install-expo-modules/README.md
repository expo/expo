<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>install-expo-modules</code>
</h1>

<p align="center">A tool for existing React Native projects to adopt <a href="https://docs.expo.dev/versions/latest/">expo-modules and SDK easier</a>.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/install-expo-modules">

  <a href="https://www.npmjs.com/package/install-expo-modules">
    <img src="https://flat.badgen.net/npm/dw/install-expo-modules" target="_blank" />
  </a>
</p>

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
- Since expo-modules' minimal requirements for iOS is 12.0, if your ios deployment target is lower than that, this tool will upgrade your deployment target to 12.0.
- `pod install` at last to update linked modules for iOS.
