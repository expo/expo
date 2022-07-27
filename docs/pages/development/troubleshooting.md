---
title: Troubleshooting
---

Issues are often solved by upgrading to the latest version of `expo-dev-client`, Expo CLI, and EAS CLI.

If you're not able to resolve your issue, please [let us know!](https://github.com/expo/expo/issues/new?template=dev_client_bug_report.yml)

### The keyboard shortcuts for the Dev Menu don't work reliably in iOS simulator

Make sure you have "Send keyboard input to device" enabled for the simulator. This option can be found under I/O > Input in the menu.

### I am getting a build error from Swift on `import expo-dev-launcher` line

If you are building for iOS and getting an error that looks something like this:

```
❌  (ios/Pods/Target Support Files/Pods-yourproject/ExpoModulesProvider.swift:11:12)

> 11 | import expo-dev-launcher
     |            ^ consecutive statements on a line must be separated by ';'
  12 | import expo-dev-menu
```

You have an outdated version of `expo-modules-autolinking` (below 0.7.x) installed as a transitive dependency in your project.

A common reason for this is installing `expo-cli` or `eas-cli` as dependencies of your project, rather than globally as we recommend; removing those packages should fix the error.

Otherwise, run `yarn why expo-modules-autolinking` to see where the outdated version is coming from, and upgrade that package to the latest version.
