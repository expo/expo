---
title: iOS AppDelegate Subscribers
---

import { Callout } from '~/ui/components/Callout';
import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

<Callout type="warning">Expo Modules APIs are in beta and subject to breaking changes.</Callout>
<br />

In order to respond to certain iOS system events relevant to an app, such as inbound links and notifications, it is necessary to handle the corresponding methods in the `AppDelegate`.

The React Native module API does not provide any mechanism to hook into these methods, and so setup instructions for React Native libraries often include a step to copy code into the `AppDelegate` file. To simplify and automate setup and maintenance, the Expo Modules API provides a mechanism that allows your library to subscribe to calls to `AppDelegate` functions. In order for this to work, the app `AppDelegate` must inherit from `ExpoAppDelegate`, and this is a requirement for using Expo Modules.

`ExpoAppDelegate` implements most functions from [`UIApplicationDelegate`](https://developer.apple.com/documentation/uikit/uiapplicationdelegate) protocol and forwards their calls to all the subscribers.

## Get Started

First, you need to have created an Expo module or integrated the Expo modules API in library using the React Native module API. [Learn more](./overview.md#setup)

Create a new public Swift class that extends `ExpoAppDelegateSubscriber` from `ExpoModulesCore` and add its name to the `ios.appDelegateSubscribers` array in the [module config](./module-config.md). Run `pod install`, and the subscriber will be generated in the **ExpoModulesProvider.swift** file within the application project.

Now you can subscribe to events by adding delegate functions to your subscriber class. For the full list of functions that you can subscribe to, see the functions that are overriden in [`ExpoAppDelegate.swift`](https://github.com/expo/expo/tree/main/packages/expo-modules-core/ios/AppDelegates/ExpoAppDelegate.swift). App delegate functions that may cause side effects when provided are not supported yet (e.g. [`application(_:viewControllerWithRestorationIdentifierPath:coder:)`](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623062-application)).

> Note: Objective-C classes are not supported.

## Result Values

Delegate functions that need to return a value have some additional logic to reconcile responses from multiple subscribers and try to satisfy all of them. There are two good examples of such edge cases:

#### `application(_:didFinishLaunchingWithOptions:) -> Bool`

According to the [Apple documentation](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1622921-application), you should return `false` if the app cannot handle the URL resource or continue a user activity, otherwise `true` should be returned. The return value is ignored if the app is launched as a result of a remote notification.
In such situations, if at least one of the subscribers returns `true`, the `ExpoAppDelegate` will return `true` as well.

#### `application(_:didReceiveRemoteNotification:fetchCompletionHandler:)`

This method tells the app delegate that a remote notification arrived and gives the app the opportunity to fetch new data. It receives a completion block to execute when the fetch operation is completed. This block should be called with the fetch result value that best describes the results of your fetch request. Possible values are: `UIBackgroundFetchResult.newData`, `UIBackgroundFetchResult.noData` or `UIBackgroundFetchResult.failed`.
In this scenario, `ExpoAppDelegate` passes a new completion block to each subscriber, waits until all are completed and collects the results before calling the original completion block. The final result depends on the results collected from the subscribers, as follows in the following order:

- If at least one subscriber called the completion block with `failed` result, the delegate returns `failed` as well.
- If there is at least one `newData` result, the delegate returns `newData`.
- Otherwise `noData` is returned.

> To check out how other functions process the result of your subscriber, we recommend reading the code directly: [`ExpoAppDelegate.swift`](https://github.com/expo/expo/tree/main/packages/expo-modules-core/ios/AppDelegates/ExpoAppDelegate.swift).

## Example

<CodeBlocksTable tabs={['AppLifecycleDelegate.swift']}>

```swift
import ExpoModulesCore

public class AppLifecycleDelegate: ExpoAppDelegateSubscriber {
  public func applicationDidBecomeActive(_ application: UIApplication) {
    // The app has become active.
  }

  public func applicationWillResignActive(_ application: UIApplication) {
    // The app is about to become inactive.
  }

  public func applicationDidEnterBackground(_ application: UIApplication) {
    // The app is now in the background.
  }

  public func applicationWillEnterForeground(_ application: UIApplication) {
    // The app is about to enter the foreground.
  }

  public func applicationWillTerminate(_ application: UIApplication) {
    // The app is about to terminate.
  }
}
```

</CodeBlocksTable>

<CodeBlocksTable tabs={['expo-module.config.json']}>

```json
{
  "ios": {
    "appDelegateSubscribers": ["AppLifecycleDelegate"]
  }
}
```

</CodeBlocksTable>
