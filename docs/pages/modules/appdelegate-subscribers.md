---
title: AppDelegate Subscribers
---

import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

Some native modules need the user to manually apply changes in the **AppDelegate.m** file (e.g. app state changes, linking, notifications) to make them working properly. To automate this process, Expo Modules provide a mechanism that allows your library to capture calls to `AppDelegate` functions. The only thing that the user needs to do to use your library is to make `AppDelegate` class inherit from `ExpoAppDelegate`.

`ExpoAppDelegate` implements most functions from [`UIApplicationDelegate`](https://developer.apple.com/documentation/uikit/uiapplicationdelegate) protocol and forwards their calls to all the subscribers.

Add your subscriber name to `ios.appDelegateSubscribers` array in the [module config](module-config). After reinstalling the pods, the subscriber should be placed in the **ExpoModulesProvider.swift** file within the application project.
