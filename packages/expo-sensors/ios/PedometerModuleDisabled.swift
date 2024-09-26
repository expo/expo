// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class PedometerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExponentPedometer")

    AsyncFunction("isAvailableAsync") {
      return false
    }

    AsyncFunction("getStepCountAsync") { (_: Double, _: Double, promise: Promise) in
      promise.reject(PedometerDisabledException())
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      promise.reject(PedometerDisabledException())
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      promise.reject(PedometerDisabledException())
    }
  }
}

internal final class PedometerDisabledException: Exception {
  override var reason: String {
    "This app has disabled motionPermission and CMPedometer services will fail. If you want to use CMPedometer services set a custom motionPermission string."
  }
}
