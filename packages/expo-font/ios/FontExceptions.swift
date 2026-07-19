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

internal final class FontNoPostScriptException: GenericException<String> {
  override var reason: String {
    "Could not create font '\(param)' from loaded data because it is missing the PostScript name"
  }
}

internal struct FontRegistrationErrorInfo {
  let fontFamilyAlias: String
  let cfError: CFError
  let ctFontManagerError: CTFontManagerError?
}

internal final class FontRegistrationFailedException: GenericException<FontRegistrationErrorInfo> {
  override var reason: String {
    let ctErrorDescription = "CTFontManagerError code: " + (param.ctFontManagerError.map { String($0.rawValue) } ?? "N/A")
    return "Registering '\(param.fontFamilyAlias)' font failed with message: '\(param.cfError.localizedDescription)'. \(ctErrorDescription)"
  }
}

internal final class UnregisteringFontFailedException: GenericException<CFError> {
  override var reason: String {
    "Unregistering font failed with message: '\(param.localizedDescription)'"
  }
}

internal final class CreateImageException: Exception {
  override var reason: String {
    "Could not create image"
  }
}

internal final class SaveImageException: GenericException<String> {
  override var reason: String {
    "Could not save image to '\(param)'"
  }
}
