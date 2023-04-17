import ExpoModulesCore

internal class InvalidOrientationLockException: Exception {
  override var reason: String {
    "Invalid screen orientation lock"
  }
}

internal class UnsupportedOrientationLockException: GenericException<String?> {
  override var reason: String {
    "This device does not support the requested orientation \(param ?? "")"
  }
}
