import ExpoModulesCore

internal final class AgeRangeException: Exception, @unchecked Sendable {
  init(_ message: String, code: String? = nil) {
    super.init(name: "AgeRangeException", description: "[ExpoAgeRange]: \(message)", code: code)
  }
}
