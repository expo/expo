// Copyright 2018-present 650 Industries. All rights reserved.

/**
 This class determines the order of `ExpoReactDelegateHandler`.

 The priority is only for internal use and we maintain a pre-defined `SUPPORTED_MODULE` map.
 */
internal struct ModulePriorities {
  static let SUPPORTED_MODULE = [
    // {key}: {value}
    // key: node package name
    // value: priority value, the higher value takes precedence
    "expo-screen-orientation": 10,
    "expo-updates": 5
  ]

  static func get(_ packageName: String) -> Int {
    return SUPPORTED_MODULE[packageName] ?? 0
  }
}
