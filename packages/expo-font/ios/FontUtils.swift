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
    #if os(iOS) || os(tvOS)
      return UIFont.fontNames(forFamilyName: fontFamilyName)
    #elseif os(macOS)
      return NSFontManager.shared.availableMembers(ofFontFamily: fontFamilyName)?.compactMap { $0[0] as? String } ?? []
    #endif
    }
  }
}

/**
 Loads the font from the given url and returns it as ``CGFont``.
 */
internal func loadFont(fromUrl url: CFURL, alias: String) throws -> CGFont {
  guard let provider = CGDataProvider(url: url),
    let cgFont = CGFont(provider) else {
    throw FontCreationFailedException(alias)
  }

  return cgFont
}

/**
 Registers the given font to make it discoverable through font descriptor matching.
 */
internal func registerFont(_ fontUrl: CFURL) throws {
  var error: Unmanaged<CFError>?

  if !CTFontManagerRegisterFontsForURL(fontUrl, .process, &error), let error = error?.takeRetainedValue() {
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
 Returns a boolean indicating if the font is successfully unregistered after this function completes.
 */
internal func unregisterFont(url: CFURL) throws -> Bool {
  var error: Unmanaged<CFError>?

  if !CTFontManagerUnregisterFontsForURL(url, .process, &error), let error = error?.takeRetainedValue() {
    if let ctFontManagerError = CTFontManagerError(rawValue: CFErrorGetCode(error as CFError)) {
      switch ctFontManagerError {
      case .systemRequired, .inUse:
        return false
      case .notRegistered:
        return true
      default:
        throw UnregisteringFontFailedException(error)
      }
    }
  }
  return true
}
