# expo_flutter_adapter

A Flutter adapter for Expo Universal Modules. It requires [`@unimodules/core`](../@unimodules/core) to be installed and linked.

## Getting Started

### Installation

Add the plugin as a dependency in your Flutter project's `pubspec.yaml` file.

```yaml
dependencies:
  expo_flutter_adapter: ^0.1.0
```

To install it directly from our git repo, specify the dependency as shown below:

```yaml
dependencies:
  expo_flutter_adapter:
    git:
      url: git://github.com/expo/expo.git
      path: packages/expo-flutter-adapter
```

### Configuration

In your Android app's `MainActivity.java` file:

1. Import the adapter's java package by adding `import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;` to your imports section.

2. Add a call to `ExpoFlutterAdapterPlugin`'s `initialize` method after the `GeneratedPluginRegistrant.registerWith(this);` call by adding `ExpoFlutterAdapterPlugin.initialize();` after it.

## Usage

If you're simply adding this to consume other previously developed Flutter Universal Module plugins, you won't have to read past this point.

If you're developing a Universal Module Flutter plugin, you are probably interested in the `ExpoModulesProxy` for interfacing with native Universal Modules from Dart. 

You can import the module proxy by adding this line to the beginning of your dart file:

```dart
import 'package:expo_flutter_adapter/expo_modules_proxy.dart';
```

This file contains two classes: `ExpoModulesProxy` and `ExpoEvent`.

### `ExpoModulesProxy`

The Dart API of the `ExpoModuleProxy` is as follows:

```dart
static Future<dynamic> callMethod(String moduleName, String methodName, [List<dynamic> arguments = const []])
```

`ExpoModuleProxy.callMethod` is a static method that your plugin can use to call a method exposed by the specified Universal Module. The parameter names should be pretty self-explanatory.

```dart
static Future<dynamic> getConstant(String moduleName, String constantName)
```

`ExpoModuleProxy.getConstant` is a static method that your plugin can use to retrieve a constant exposed by the specified Universal Module.

```dart
static Stream<ExpoEvent> get events
```

`ExpoModuleProxy.events` is a stream of all events being emitted by the Universal Module core. As a plugin developer, you can filter by event names to expose module-specific events to your consumers. See [accelerometer.dart from the expo_sensors package](../expo-sensors-flutter-plugin/lib/accelerometer.dart) for an example.


### `ExpoEvent`

`ExpoEvent` is a data class streamed from `ExpoModuleProxy.events` that has the following properties:

`expoEvent.name (String)`: the name of the incoming event.

`expoEvent.body (Map<String, dynamic>)`: the payload of the incoming event.

**Pro Tip:** _See other Universal Module Flutter plugins in the packages directory of this repository for more examples of how this adapter is used._
