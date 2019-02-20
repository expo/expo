# expo_sensors

A Flutter plugin for the `expo-sensors` Universal Module. It requires [`expo-sensors`](../expo-sensors) to be installed and linked as well as [`expo-flutter-adapter`](../expo-flutter-adapter) to installed as a peer dependency in your Flutter project.

## Getting Started

### Installation

Add the plugin as a dependency in your Flutter project's `pubspec.yaml` file.

```yaml
dependencies:
  expo_sensors: ^0.1.0
```

To install it directly from our git repo, specify the dependency as shown below:

```yaml
dependencies:
  expo_sensors:
    git:
      url: git://github.com/expo/expo.git
      path: packages/expo-sensors-flutter-plugin
```

## Usage

There are five different device sensors that you can access via this plugin. These sensors are: `Accelerometer`, `Gyroscope`, `Magnetometer`, `Pedometer`, and `DeviceMotion`.

### Three-Axis Sensors

All three three-axis sensors provided in this plugin (`Accelerometer`, `Gyroscope`, and `Magnetometer`) contain the same set of methods and event shapes.

Each file contains an event type that has three members: `x`, `y`, and `z` which are all of type `double`.

The sensor class itself has an API similar to what follows:

```dart
static final Stream<GyroscopeEvent> events;

static Future<dynamic> setUpdateInterval(Duration interval);
```

You can import a sensor modules with the line below, replacing `<sensor_name>` with the actual sensor name of course. 

```dart
import 'package:expo_sensors/<sensor_name>.dart';
```

### Pedometer

#### `PedometerEvent`

`PedometerEvent` is a data class that has a single property, `steps` which is of type `int`.

#### `Pedometer`

```dart
static final Stream<PedometerEvent> events
```

`Pedometer.events` is a stream of step counting events that lets you know how many steps one has taken since you started listening to the stream.

```dart
static Future<int> getStepCount(DateTime startDate, DateTime endDate)
```

`Pedometer.getStepCount` should be pretty self-explanatory. `startDate` should be before `endDate`.

```dart
static Future<bool> getAvailability()
```

`Pedometer.getAvailability` will check (and ask if necessary) for permissions to access the device's pedometer.

### DeviceMotion

#### `DeviceMotionEvent`

Instances of `DeviceMotionEvent` have the following members:

```dart
  final Map acceleration;
  final Map accelerationIncludingGravity;
  final Map rotation;
  final Map rotationRate;
  final int orientation;
```

#### `DeviceMotion`

The API for DeviceMotion is as follows:

```dart
static final Stream<DeviceMotionEvent> events
```

`DeviceMotion.events` is pretty self-explanatory.

```dart
static Future<dynamic> setUpdateInterval(Duration interval)
```

`DeviceMotion.setUpdateInterval` is pretty self-explanatory too.

```dart
static Future<double> getGravity()
```

`DeviceMotion.getGravity` returns the measured gravity variable from your device.