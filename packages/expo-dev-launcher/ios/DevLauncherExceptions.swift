import ExpoModulesCore

internal class InvalidURLException: Exception {
  override var code: String {
    "ERR_DEV_LAUNCHER_INVALID_URL"
  }

  override var reason: String {
    "Cannot parse the provided url."
  }
}

internal class CannotLoadAppException: GenericException<String> {
  override var code: String {
    "ERR_DEV_LAUNCHER_CANNOT_LOAD_APP"
  }

  override var reason: String {
    "Could not load the app: \(param)"
  }
}
