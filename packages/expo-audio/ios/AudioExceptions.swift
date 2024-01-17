import ExpoModulesCore

internal class InvalidCategoryException: GenericException<String> {
  override var reason: String {
    "`\(param)` is not a valid audio category"
  }
}

internal class PlayerException: Exception {
  override var reason: String {
    ""
  }
}

internal class AudioPermissionsException: Exception {
  override var reason: String {
    "Recording permission has not been grated"
  }
}
