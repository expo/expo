import ABI49_0_0ExpoModulesCore

class InvalidVoiceException: GenericException<String> {
  override var reason: String {
    "Cannot find voice with identifier: \(param)!"
  }
}
