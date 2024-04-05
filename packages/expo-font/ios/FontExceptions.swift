import ExpoModulesCore

internal final class FontFileNotFoundException: GenericException<String> {
  override var reason: String {
    "Font file '\(param)' doesn't exist"
  }
}

internal final class FontCreationFailedException: GenericException<String> {
  override var reason: String {
    "Could not create font from loaded data for '\(param)'"
  }
}

internal final class FontRegistrationFailedException: GenericException<CFError> {
  override var reason: String {
    "Registering '\(param)' font failed with message: '\(param.localizedDescription)'"
  }
}
