import ExpoModulesCore

internal final class IntegrityException: Exception {
  init(_ message: String, code: String? = nil) {
    super.init(name: "IntegrityException", description: "[ExpoAppIntegrity]: \(message)", code: code)
  }
}
