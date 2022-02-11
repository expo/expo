---
title: Module API
---

import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

> Note: This API is still experimental and subject to change. Some features that you need may not be implemented yet.

The Expo module API provided by `expo-modules-core` is an abstraction layer on top of React Native modules that helps you build native modules in modern languages (Swift and Kotlin) with an easy to use and convenient API that is consistent across platforms where possible.

## Design considerations

### Why Swift and Kotlin?

After several years of maintaining over 50 native modules in the Expo SDK, we have found out that many issues that have arisen were caused by unhandled null values or using incorrect types. Modern language features can help developers avoid these bugs; for example, the lack of optional types combined with the dynamism of Objective-C made it tough to catch certain classes of bugs that would have been caught by the compiler in Swift.

This is one of the reasons why the Expo module ecosystem was designed from the ground up to be used with modern native languages: Swift and Kotlin.

### Passing data between runtimes

Another big pain point that we have encountered is the validation of arguments passed from JavaScript to native functions. This is especially error prone, time consuming, and difficult to maintain when it comes to `NSDictionary` or `ReadableMap`, where the type of values is unknown in runtime and each property needs to be validated separately by the developer. A valuable feature of the Expo module API is that it has full knowledge of the argument types the native function expects, so it can pre-validate and convert the arguments for you! The dictionaries can be represented as native structs that we call [Records](#records). Knowing the argument types, it is also possible to [automatically convert arguments](#convertibles) to some platform-specific types (e.g. `{ x: number, y: number }` or `[number, number]` can be translated to CoreGraphics's `CGPoint` for your convenience).

## Get Started

### 1. Set up the library as an Expo module

To use the Expo module API, you need [set up your library as an Expo module](overview). Once that is complete, create Swift and Kotlin files from the below templates.

<CodeBlocksTable>

```swift
import ExpoModulesCore

public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    // Definition components go here
  }
}
```

```kotlin
package my.module.package

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    // Definition components go here
  }
}
```

</CodeBlocksTable>

### 2. Set up module config

Add your classes to iOS and/or Android `modulesClassNames` in the [module config](module-config).

<CodeBlocksTable tabs={["expo-module.config.json"]}>

```json
{
  "ios": {
    "modulesClassNames": ["MyModule"]
  },
  "android": {
    "modulesClassNames": ["my.module.package.MyModule"]
  }
}
```

</CodeBlocksTable>

### 3. Ensure the module is linked

**On iOS** you also need to run `pod install` to link the new class.

**On Android** it will be linked automatically before building.

Now that the class is set up and linked, you can start to add functionality. The rest of this guide is a reference for the module API, along with links to [examples](#examples) of simple to moderately complex real-world modules that you can reference to better understand how to use the API.

## Definition Components

As you might have noticed in the snippets above, each module class must implement the `definition` function. The definition consists of components that describe the module's functionality and behavior.

### `name`

Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument. Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.

<CodeBlocksTable tabs={["Swift / Kotlin"]}>

```swift
name("MyModuleName")
```

</CodeBlocksTable>

### `constants`

Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.

<CodeBlocksTable>

```swift
// Created from the dictionary
constants([
  "PI": Double.pi
])

// or returned by the closure
constants {
  return [
    "PI": Double.pi
  ]
}
```

```kotlin
// Passed as arguments
constants(
  "PI" to kotlin.math.PI
)

// or returned by the closure
constants {
  return@constants mapOf(
    "PI" to kotlin.math.PI
  )
}
```

</CodeBlocksTable>

### `function`

Defines a native function that will be exported to JavaScript.

#### Arguments

- **name**: `String` — Name of the function that you'll call from JavaScript.
- **body**: `(args...) -> ReturnType` — The closure to run when the function is called.

All functions return a `Promise` to JavaScript and are asychronous from the perspective of the JavaScript runtime. However, if the type of the last argument is `Promise`, the function is considered to be asynchronous on the native side and it will wait for the promise to be resolved or rejected before the response is passed back to JavaScript. Otherwise, the function is immediately resolved with the returned value or rejected if it throws an error. Note that this is different than synchronous/asynchronous calls in JavaScript — at this moment all functions are _asynchronous_ from the JavaScript perspective.

The function can receive up to 8 arguments (including the promise). This is due to the limitations of generics in both Swift and Kotlin, because this component must be implemented separately for each number of arguments.

<CodeBlocksTable>

```swift
function("syncFunction") { (message: String) in
  return message
}

function("asyncFunction") { (message: String, promise: Promise) in
  DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
    promise.resolve(message)
  }
}
```

```kotlin
function("syncFunction") { message: String ->
  return@function message
}

function("asyncFunction") { message: String, promise: Promise ->
  launch(Dispatchers.Main) {
    promise.resolve(message)
  }
}
```

```javascript
import { NativeModulesProxy } from 'expo-modules-core';

// Assume that we have named the module "MyModule"
const { MyModule } = NativeModulesProxy;

async function getMessage() {
  // Functions that are synchronous on the native side are still asynchronous to
  // JavaScript and return a promise
  const message = await MyModule.syncFunction('foo');
  const otherMessage = await MyModule.asyncFunction('bar');
  console.log(`${message} ${otherMessage}); // foo bar
}
```

</CodeBlocksTable>

### `events`

Defines event names that the module can send to JavaScript.

<CodeBlocksTable>

```swift
events("onCameraReady", "onPictureSaved", "onBarCodeScanned")
```

```kotlin
events("onCameraReady", "onPictureSaved", "onBarCodeScanned")
```

</CodeBlocksTable>

### `view`

Defines the factory creating a native view, when the module is used as a view.
On Android, the factory function also receives [Android Context](https://developer.android.com/reference/android/content/Context) which is required to create any view.

<CodeBlocksTable>

```swift
view {
  UITextView()
}
```

```kotlin
view { context ->
  TextView(context)
}
```

</CodeBlocksTable>

### `prop`

Defines a setter for the view prop of given name.

#### Arguments

- **name**: `String` — Name of view prop that you want to define a setter.
- **setter**: `(view: ViewType, value: ValueType) -> ()` — Closure that is invoked when the view rerenders.

This property can only be used within a [`viewManager`](#viewmanager) closure.

<CodeBlocksTable>

```swift
prop("background") { (view: UIView, color: UIColor) in
  view.backgroundColor = color
}
```

```kotlin
prop("background") { view: View, @ColorInt color: Int ->
  view.setBackgroundColor(color)
}
```

</CodeBlocksTable>

> Note: Props of function type (callbacks) are not supported yet.

### `viewManager`

Enables the module to be used as a view manager. The view manager definition is built from the definition components used in the closure passed to `viewManager`. Definition components that are accepted as part of the view manager definition: [`view`](#view), [`prop`](#prop).

<CodeBlocksTable>

```swift
viewManager {
  view {
    UIView()
  }

  prop("isHidden") { (view: UIView, hidden: Bool) in
    view.isHidden = hidden
  }
}
```

```kotlin
viewManager {
  view { context ->
    View(context)
  }

  prop("isHidden") { view: View, hidden: Bool ->
    view.isVisible = !hidden
  }
}
```

</CodeBlocksTable>

### `onCreate`

Defines module's lifecycle listener that is called right after module initialization. If you need to set up something when the module gets initialized, use this instead of module's class initializer.

### `onDestroy`

Defines module's lifecycle listener that is called when the module is about to be deallocated. Use it instead of module's class destructor.

### `onStartObserving`

Defines the function that is invoked when the first event listener is added.

### `onStopObserving`

Defines the function that is invoked when all event listeners are removed.

### `onAppContextDestroys`

Defines module's lifecycle listener that is called when the app context owning the module is about to be deallocated.

### `onAppEntersForeground` 🍏

Defines the listener that is called when the app is about to enter the foreground mode.

> Note: This function is not available on Android — you may want to use [`onActivityEntersForeground`](#onactivityentersforeground--) instead.

### `onAppEntersBackground` 🍏

Defines the listener that is called when the app enters the background mode.

> Note: This function is not available on Android — you may want to use [`onActivityEntersBackground`](#onactivityentersbackground--) instead.

### `onAppBecomesActive` 🍏

Defines the listener that is called when the app becomes active again (after `onAppEntersForeground`).

> Note: This function is not available on Android — you may want to use [`onActivityEntersForeground`](#onactivityentersforeground--) instead.

### `onActivityEntersForeground` 🤖

> Note: This function is not available on iOS — you may want to use [`onAppEntersForeground`](#onappentersforeground--) instead.

### `onActivityEntersBackground` 🤖

> Note: This function is not available on iOS — you may want to use [`onAppEntersBackground`](#onappentersbackground--) instead.

### `onActivityDestroys` 🤖

Defines the listener that is called when the activity owning the JavaScript context is about to be destroyed.

> Note: This function is not available on iOS — you may want to use [`onAppEntersBackground`](#onappentersbackground--) instead.

## Argument Types

Fundamentally, only primitive and serializable data can be passed back and forth between the runtimes. However, usually native modules need to receive custom data structures — more sophisticated than just the dictionary/map where the values are of unknown (`Any`) type and so each value has to be validated and casted on its own. The Expo module API provides protocols to make it more convenient to work with data objects, to provide automatic validation, and finally, to ensure native type-safety on each object member.

### Convertibles

_Convertibles_ are native types that can be initialized from certain specific kinds of data received from JavaScript. Such types are allowed to be used as an argument type in `function`'s body. As a good example, when the `CGPoint` type is used as a function argument type, its instance can be created from an array of two numbers (_x_, _y_) or a JavaScript object with numeric `x` and `y` properties.

Some common iOS types from `CoreGraphics` and `UIKit` system frameworks are already made convertible.

| Native Type | TypeScript                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `URL`       | `string` with a URL. When scheme is not provided, it's assumed to be a file URL.                                   |
| `CGFloat`   | `number`                                                                                                           |
| `CGPoint`   | `{ x: number, y: number }` or `number[]` with _x_ and _y_ coords                                                   |
| `CGSize`    | `{ width: number, height: number }` or `number[]` with _width_ and _height_                                        |
| `CGVector`  | `{ dx: number, dy: number }` or `number[]` with _dx_ and _dy_ vector differentials                                 |
| `CGRect`    | `{ x: number, y: number, width: number, height: number }` or `number[]` with _x_, _y_, _width_ and _height_ values |
| `CGColor`   | Color hex strings in formats: `#RRGGBB`, `#RRGGBBAA`, `#RGB`, `#RGBA`                                              |
| `UIColor`   | Color hex strings in formats: `#RRGGBB`, `#RRGGBBAA`, `#RGB`, `#RGBA`                                              |

### Records

_Record_ is a convertible type and an equivalent of the dictionary (Swift) or map (Kotlin), but represented as a struct where each field can have its own type and provide a default value.

<CodeBlocksTable>

```swift
struct FileReadOptions: Record {
  @Field
  var encoding: String = "utf8"

  @Field
  var position: Int = 0

  @Field
  var length: Int?
}

// Now this record can be used as an argument of the functions or the view prop setters.
function("readFile") { (path: String, options: FileReadOptions) -> String in
  // Read the file using given `options`
}
```

```kotlin
class FileReadOptions : Record {
  @Field
  val encoding: String = "utf8"

  @Field
  val position: Int = 0

  @Field
  val length: Int?
}

// Now this record can be used as an argument of the functions or the view prop setters.
function("readFile") { path: String, options: FileReadOptions ->
  // Read the file using given `options`
}
```

</CodeBlocksTable>

### Enums

With enums we can go even further with the above example (with `FileReadOptions` record) and limit supported encodings to `"utf8"` and `"base64"`. To use an enum as an argument or record field, it must represent a primitive value (e.g. `String`, `Int`) and conform to `EnumArgument`.

<CodeBlocksTable>

```swift
enum FileEncoding: String, EnumArgument {
  case utf8
  case base64
}

struct FileReadOptions: Record {
  @Field
  var encoding: FileEncoding = .utf8
  // ...
}
```

```kotlin
// Note: the constructor must have an argument called value.
enum class FileEncoding(val value: String) {
  utf8("utf8"),
  base64("base64")
}

class FileReadOptions : Record {
  @Field
  val encoding: FileEncoding = FileEncoding.utf8
  // ...
}
```

</CodeBlocksTable>

## Examples

<CodeBlocksTable>

```swift
public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    name("MyFirstExpoModule")

    function("hello") { (name: String) in
      return "Hello \(name)!"
    }
  }
}
```

```kotlin
class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    name("MyFirstExpoModule")

    function("hello") { name: String ->
      return "Hello $name!"
    }
  }
}
```

</CodeBlocksTable>

For more examples from real modules, you can refer to Expo modules that already use this API on GitHub:

- `expo-cellular` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-cellular/ios/CellularModule.swift), [Kotlin](https://github.com/expo/expo/tree/main/packages/expo-cellular/android/src/main/java/expo/modules/cellular/CellularModule.kt))
- `expo-linear-gradient` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-linear-gradient/ios/LinearGradientModule.swift)), [Kotlin](https://github.com/expo/expo/tree/main/packages/expo-linear-gradient/android/src/main/java/expo/modules/lineargradient/LinearGradientModule.kt)
- `expo-haptics` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-haptics/ios/HapticsModule.swift))
- `expo-clipboard` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-clipboard/ios/EXClipboard/ClipboardModule.swift))
- `expo-localization` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-localization/ios/LocalizationModule.swift))
- `expo-system-ui` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-system-ui/ios/ExpoSystemUI/ExpoSystemUIModule.swift))
- `expo-image-manipulator` ([Swift](https://github.com/expo/expo/tree/main/packages/expo-image-manipulator/ios/ImageManipulatorModule.swift))
