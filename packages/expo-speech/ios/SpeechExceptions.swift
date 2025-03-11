import ExpoModulesCore

internal final class InvalidVoiceException: GenericException<String> {
  override var reason: String {
    "Cannot find voice with identifier: \(param)!"
  }
}
