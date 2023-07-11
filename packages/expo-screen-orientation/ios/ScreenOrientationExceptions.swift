import ExpoModulesCore

internal class InvalidOrientationLockException: Exception {
  override var reason: String {
    "Invalid screen orientation lock"
  }
}

internal class UnsupportedOrientationLockException: GenericException<ModuleOrientationLock?> {
  override var reason: String {
    guard let param = param else {
      return "This device does not support the requested orientation"
    }
    return "This device does not support the requested orientation: \(param)"
  }
}
