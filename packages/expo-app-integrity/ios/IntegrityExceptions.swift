import ExpoModulesCore

internal final class IntegrityException: GenericException<String> {
  override var reason: String {
    return "[ExpoAppIntegrity]: \(param)"
  }
}
