import ExpoModulesCore

internal class InvalidCategoryException: GenericException<String> {
  override var reason: String {
    "`\(param)` is not a valid audio category"
  }
}

internal class AudioStateException: GenericException<String> {
  override var reason: String {
    "Failed to change audio state: \(param)"
  }
}

internal class AudioPermissionsException: Exception {
  override var reason: String {
    "Recording permission has not been granted"
  }
}
