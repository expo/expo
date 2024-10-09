import ExpoModulesCore

internal class TaskAlreadyRegistered: Exception {
  override var reason: String {
    "The task was already registered."
  }
}

internal class TaskNotRegistered: Exception {
  override var reason: String {
    "The task was not registered."
  }
}

internal class CouldNotRegisterTask: GenericException<String> {
  override var reason: String {
    "The task could not be registered: \(param)"
  }
}
