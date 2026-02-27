# expo-updates-interface

Native interface for modules that optionally depend on expo-updates. This package provides a unified native API (iOS and Android) for querying the state of the updates system and subscribing to state machine transitions, without requiring a direct dependency on `expo-updates`.

## Overview

`expo-updates-interface` defines two levels of interface:

- **`UpdatesInterface`** -- implemented by all updates controllers (enabled, disabled, and dev-launcher). Provides read-only properties describing the running update and a method to subscribe to state machine changes.
- **`UpdatesDevLauncherInterface`** -- extends `UpdatesInterface` with additional methods used exclusively by `expo-dev-launcher` to fetch updates and manage the update lifecycle.

A singleton **`UpdatesControllerRegistry`** provides access to the active controller that implements one or both of the above interfaces.

## API documentation

### UpdatesControllerRegistry

The registry provides the active updates controller as a weak reference, in the `controller` property. The reference will be null when `expo-updates` is not installed and compiled into the app. If `expo-updates` is present, the property is set automatically at startup.

| Platform    | Access                                                |
| ----------- | ----------------------------------------------------- |
| **iOS**     | `UpdatesControllerRegistry.sharedInstance.controller` |
| **Android** | `UpdatesControllerRegistry.controller?.get()`         |

### UpdatesInterface

All updates controllers implement this interface. It is available whether updates is enabled, disabled, or running under the dev client.

#### Properties

| Property                                  | Type               | Description                                                                                                   |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `isEnabled`                               | `Bool` / `Boolean` | Whether the updates system is enabled. Defaults to `false` when updates is disabled.                          |
| `runtimeVersion`                          | `String?`          | The runtime version of the running app. Set when updates is enabled or the dev client is running.             |
| `updateURL` (iOS) / `updateUrl` (Android) | `URL?` / `Uri?`    | The update URL configured for this app. Set when updates is enabled or the dev client is running.             |
| `launchedUpdateId`                        | `UUID?`            | The ID of the currently running update. Only set when updates is enabled.                                     |
| `embeddedUpdateId`                        | `UUID?`            | The ID of the update embedded in the app binary. Only set when updates is enabled.                            |
| `launchAssetPath`                         | `String?`          | The local file path of the launch asset (JS bundle) for the running update. Only set when updates is enabled. |

#### Methods

##### `subscribeToUpdatesStateChanges`

Registers a listener that will be called on updates state machine transitions. Returns a subscription object that can be used to unsubscribe.

**iOS:**

```swift
func subscribeToUpdatesStateChanges(_ listener: any UpdatesStateChangeListener) -> UpdatesStateChangeSubscription
```

**Android (Kotlin):**

```kotlin
fun subscribeToUpdatesStateChanges(listener: UpdatesStateChangeListener): UpdatesStateChangeSubscription
```

### UpdatesStateChangeListener

A listener protocol/interface that receives state machine transition events.

**iOS:**

```swift
public protocol UpdatesStateChangeListener {
  func updatesStateDidChange(_ event: [String: Any])
}
```

**Android (Kotlin):**

```kotlin
interface UpdatesStateChangeListener {
  fun updatesStateDidChange(event: Map<String, Any>)
}
```

The `event` dictionary contains information about the state transition, matching the structure of the updates state machine events exposed by the `expo-updates` JS API.

### UpdatesStateChangeSubscription

Returned by `subscribeToUpdatesStateChanges`. Call `remove()` to unsubscribe and stop receiving state change events.

**iOS:**

```swift
public protocol UpdatesStateChangeSubscription {
  func remove()
}
```

**Android (Kotlin):**

```kotlin
interface UpdatesStateChangeSubscription {
  fun remove()
}
```

### UpdatesDevLauncherInterface

Extends `UpdatesInterface` with methods used by `expo-dev-launcher` to fetch and manage updates. This interface is only implemented by the dev-launcher updates controller.

See the source files for the full method signatures:

- **iOS:** [`UpdatesInterface.swift`](ios/EXUpdatesInterface/UpdatesInterface.swift)
- **Android:** [`UpdatesInterface.kt`](android/src/main/java/expo/modules/updatesinterface/UpdatesInterface.kt)

## Usage example

### Reading update information (Kotlin)

```kotlin
import expo.modules.updatesinterface.UpdatesControllerRegistry

val controller = UpdatesControllerRegistry.controller?.get()
if (controller != null && controller.isEnabled) {
  val updateId = controller.launchedUpdateId
  val runtimeVersion = controller.runtimeVersion
  // ...
}
```

### Reading update information (Swift)

```swift
import EXUpdatesInterface

if let controller = UpdatesControllerRegistry.sharedInstance.controller,
   controller.isEnabled {
  let updateId = controller.launchedUpdateId
  let runtimeVersion = controller.runtimeVersion
  // ...
}
```

### Subscribing to state changes (Kotlin)

```kotlin
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesStateChangeListener
import expo.modules.updatesinterface.UpdatesStateChangeSubscription

val controller = UpdatesControllerRegistry.controller?.get() ?: return

val subscription = controller.subscribeToUpdatesStateChanges(object : UpdatesStateChangeListener {
  override fun updatesStateDidChange(event: Map<String, Any>) {
    // Handle state change event
  }
})

// Later, to unsubscribe:
subscription.remove()
```

### Subscribing to state changes (Swift)

```swift
import EXUpdatesInterface

class MyListener: NSObject, UpdatesStateChangeListener {
  func updatesStateDidChange(_ event: [String: Any]) {
    // Handle state change event
  }
}

let listener = MyListener()
if let controller = UpdatesControllerRegistry.sharedInstance.controller {
  let subscription = controller.subscribeToUpdatesStateChanges(listener)

  // Later, to unsubscribe:
  subscription.remove()
}
```

## Installation in an Expo native module

- The `expo-updates-interface` package should be added to the module's NPM dependencies. (The `expo-updates` package does not need to be added.)
- The module's iOS podspec should have "EXUpdatesInterface" added to the pod dependencies, as in this example:

```ruby
Pod::Spec.new do |s|
  s.name           = 'InterfaceDemo'
  s.version        = '1.0.0'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'EXUpdatesInterface'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
```

- The module's Android `build.gradle` should have this package added as a dependency, as in this example:

```gradle
android {
  namespace "expo.modules.interfacedemo"
  defaultConfig {
    versionCode 1
    versionName "0.7.6"
  }
  lintOptions {
    abortOnError false
  }
}

dependencies {
  implementation project(':expo-updates-interface')
}
```

## Installation in managed Expo projects

This package is included as a dependency of `expo-updates` and `expo-dev-client`. No separate installation is needed.

## Installation in bare React Native projects

This package is included as a dependency of `expo-updates` and `expo-dev-client`. If you need to install it separately:

```sh
npx expo install expo-updates-interface
```

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
