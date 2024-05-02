import CoreGraphics

/**
 * Queries custom native font names from the Info.plist `UIAppFonts`.
 */
internal func queryCustomNativeFonts() -> [String] {
  // [0] Read from main bundle's Info.plist
  guard let fontFilePaths = Bundle.main.object(forInfoDictionaryKey: "UIAppFonts") as? [String] else {
    return []
  }

  // [1] Get font family names for each font file
  let fontFamilies: [[String]] = fontFilePaths.compactMap { fontFilePath in
    guard let fontUrl = Bundle.main.url(forResource: fontFilePath, withExtension: nil) as? URL else {
      return []
    }
    guard let fontDescriptors = CTFontManagerCreateFontDescriptorsFromURL(fontUrl as CFURL) as? [CTFontDescriptor] else {
      return []
    }
    return fontDescriptors.compactMap { descriptor in
      return CTFontDescriptorCopyAttribute(descriptor, kCTFontFamilyNameAttribute) as? String
    }
  }

  // [2] Retrieve font names by family names
  return fontFamilies.flatMap { fontFamilyNames in
    return fontFamilyNames.flatMap { fontFamilyName in
      return UIFont.fontNames(forFamilyName: fontFamilyName)
    }
  }
}

/**
 Loads the font from the given path and returns it as ``CGFont``.
 */
internal func loadFont(fromPath path: String, alias: String) throws -> CGFont {
  guard let data = FileManager.default.contents(atPath: path) else {
    throw FontFileNotFoundException(path)
  }
  guard let provider = CGDataProvider(data: data as CFData), let font = CGFont(provider) else {
    throw FontCreationFailedException(alias)
  }
  return font
}

/**
 Registers the given font to make it discoverable through font descriptor matching.
 */
internal func registerFont(_ font: CGFont) throws {
  var error: Unmanaged<CFError>?

  if !CTFontManagerRegisterGraphicsFont(font, &error), let error = error?.takeRetainedValue() {
    let fontError = CTFontManagerError(rawValue: CFErrorGetCode(error))

    switch fontError {
    case .alreadyRegistered, .duplicatedName:
      // Ignore the error if:
      // - this exact font instance was already registered or
      // - another instance already registered with the same name (assuming it's most likely the same font anyway)
      return
    default:
      throw FontRegistrationFailedException(error)
    }
  }
}

/**
 Unregisters the given font, so the app will no longer be able to render it.
 */
internal func unregisterFont(_ font: CGFont) throws {
  var error: Unmanaged<CFError>?

  if !CTFontManagerUnregisterGraphicsFont(font, &error), let error = error?.takeRetainedValue() {
    throw FontRegistrationFailedException(error)
  }
}

/**
 Unregisters a font with the given name, so the app will no longer be able to render it.
 */
internal func unregisterFont(named fontName: String) throws {
  if let font = CGFont(fontName as CFString) {
    try unregisterFont(font)
  }
}
