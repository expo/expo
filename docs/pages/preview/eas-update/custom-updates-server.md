---
title: Using expo-updates with a custom updates server
---

Expo provides a service named EAS (Expo Application Services), which can host and serve updates for an Expo app using the expo-updates library. In some cases, you may need complete control of how updates are sent to your app. To accomplish this, it's possible to implement your own custom updates server that will provide update manifests and assets to your end-users' apps.

The only requirement is that your custom server adheres to the [Expo Updates Protocol](https://github.com/expo/expo/pull/12461). To help get you started, we created a demo repo that implements the protocol that you could deploy and test.

[Custom Expo Updates Server](https://github.com/expo/custom-expo-updates-server)
