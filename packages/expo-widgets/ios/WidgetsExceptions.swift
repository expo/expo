import ExpoModulesCore

internal final class LiveActivitiesNotSupportedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Live Activities are not supported on this device"
  }
}

internal final class StartLiveActivityException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Failed to start live activity: \(param)"
  }
}

internal final class LiveActivityNotFoundException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Can't find live activity with id: \(param)"
  }
}
