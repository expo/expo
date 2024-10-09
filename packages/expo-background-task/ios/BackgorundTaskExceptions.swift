// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

internal final class TaskAlreadyRegistered: Exception {
  override var reason: String {
    "The task was already registered."
  }
}

internal final class TaskNotRegistered: Exception {
  override var reason: String {
    "The task was not registered."
  }
}

internal final class CouldNotRegisterTask: GenericException<String> {
  override var reason: String {
    "The task could not be registered: \(param)"
  }
}
