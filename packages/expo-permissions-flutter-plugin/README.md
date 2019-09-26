# expo_permissions

A Flutter plugin for the `expo-permissions` Universal Module. It requires [`expo-permissions`](../expo-permissions) to be installed and linked as well as [`expo-flutter-adapter`](../expo-flutter-adapter) to installed as a peer dependency in your Flutter project.

## Getting Started

### Installation

Add the plugin as a dependency in your Flutter project's `pubspec.yaml` file.

```yaml
dependencies:
  expo_permissions: ^0.1.0
```

To install it directly from our git repo, specify the dependency as shown below:

```yaml
dependencies:
  expo_permissions:
    git:
      url: git://github.com/expo/expo.git
      path: packages/expo-permissions-flutter-plugin
```

## Usage

```dart
import 'package:expo_permissions/expo_permissions.dart';
```

This file contains three classes: `Permissions`, `PermissionResponse` and `PermissionType`.

`Permissions` contains all of the relevant methods for asking for permissions and checking on the status your app's permission levels.

### `Permissions`

The Dart API of the `Permissions` class is as follows:

```dart
static Future<PermissionResponse> get(List<PermissionType> types)
```

`Permissions.get` is a static method that one can use to check the status of the specified permissions.

```dart
static Future<PermissionResponse> ask(List<PermissionType> types)
```

`Permissions.ask` is a static method that one can use to ask the user for a specific set of device permissions and check how the user responds.

### `PermissionResponse`

`PermissionResponse` is a object that gets returned from the `Permissions` class's methods.

A `PermissionResponse` has one method, `permissionResponse.get` which you can use to get the response of a specified `PermissionType`. The type signature for `get` is shown below:

```dart
Map<String, dynamic> get(PermissionType type)
```

The map that is returned from the `get` method contains the `"status"` and `"expires"` keys and additional related fields to the permission you've requested.

### `PermissionType`

`PermissionType` is a class that holds static constant values for you to use as permission types when using `Permissions.ask`, `Permissions.get`, or `permissionResponse.get`.
