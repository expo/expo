---
id: out-of-tree-platforms
title: Out-of-Tree Platforms
---

React Native is not just for Android and iOS - there are community-supported projects that bring it to other platforms, such as:

- [React Native Windows](https://github.com/Microsoft/react-native-windows) - React Native support for Microsoft's Universal Windows Platform (UWP) and the Windows Presentation Foundation (WPF)
- [React Native DOM](https://github.com/vincentriemer/react-native-dom) - An experimental, comprehensive port of React Native to the web. (Not to be confused with [React Native Web](https://github.com/necolas/react-native-web), which has different goals)
- [React Native Turbolinks](https://github.com/lazaronixon/react-native-turbolinks) - React Native adapter for building hybrid apps with Turbolinks 5.
- [React Native Desktop](https://github.com/status-im/react-native-desktop) - A project aiming to bring React Native to the Desktop with Qt's QML. A fork of [React Native Ubuntu](https://github.com/CanonicalLtd/react-native/), which is no longer maintained.
- [React Native macOS](https://github.com/ptmt/react-native-macos) - An experimental React Native fork targeting macOS and Cocoa

## Creating your own React Native platform

Right now the process of creating a React Native platform from scratch is not very well documented - one of the goals of the upcoming re-architecture ([Fabric](https://facebook.github.io/react-native/blog/2018/06/14/state-of-react-native-2018)) is to make maintaining a platform easier.

### Bundling

As of React Native 0.57 you can now register your React Native platform with React Native's JavaScript bundler, [Metro](https://facebook.github.io/metro/). This means you can pass `--platform example` to `react-native bundle`, and it will look for JavaScript files with the `.example.js` suffix.

To register your platform with RNPM, your module's name must match one of these patterns:

- `react-native-example` - It will search all top-level modules that start with `react-native-`
- `@org/react-native-example` - It will search for modules that start with `react-native-` under any scope
- `@react-native-example/module` - It will search in all modules under scopes with names starting with `@react-native-`

You must also have an entry in your `package.json` like this:

```json
{
  "rnpm": {
    "haste": {
      "providesModuleNodeModules": ["react-native-example"],
      "platforms": ["example"]
    }
  }
}
```

`"providesModuleNodeModules"` is an array of modules that will get added to the Haste module search path, and `"platforms"` is an array of platform suffixes that will be added as valid platforms.
