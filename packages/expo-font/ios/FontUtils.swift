import CoreGraphics
import Foundation

/**
 * Queries custom native font names from the Info.plist `UIAppFonts`.
 * We return this in JS from `getLoadedFonts()`. The JS api is mostly documented around font families, but this returns postScript names.
 * Returning families would probably be "more correct" but would break loading fonts at runtime:
 * loading e.g. Inter would succeed and then loading Inter-Bold would be skipped, both being the
 * Inter family.
 * For now, providing a postScript name as `fontFamily` style works because RN core is forgiving about this:  https://github.com/react/react-native/blob/v0.86.0/packages/react-native/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTFontUtils.mm#L359
 */
internal func queryCustomNativeFonts() -> [String] {
  // [0] Read from main bundle's Info.plist
  guard let fontFilePaths = Bundle.main.object(forInfoDictionaryKey: "UIAppFonts") as? [String] else {
    return []
  }

  // [1] Get font family names for each font file. A variable font file has one descriptor per named
  // instance of its variation axes, and they all share a family name, so the family names are
  // deduplicated to avoid looking up — and returning — the same family once per instance.
  var fontFamilyNames = [String]()

  for fontFilePath in fontFilePaths {
    guard let fontUrl = Bundle.main.url(forResource: fontFilePath, withExtension: nil),
      let fontDescriptors = CTFontManagerCreateFontDescriptorsFromURL(fontUrl as CFURL) as? [CTFontDescriptor] else {
      continue
    }
    for descriptor in fontDescriptors {
      guard let fontFamilyName = CTFontDescriptorCopyAttribute(descriptor, kCTFontFamilyNameAttribute) as? String else {
        continue
      }
      if !fontFamilyNames.contains(fontFamilyName) {
        fontFamilyNames.append(fontFamilyName)
      }
    }
  }

  // [2] Retrieve font names by family names
  return fontFamilyNames.flatMap { fontFamilyName in
  #if os(iOS) || os(tvOS)
    return UIFont.fontNames(forFamilyName: fontFamilyName)
  #elseif os(macOS)
    return NSFontManager.shared.availableMembers(ofFontFamily: fontFamilyName)?.compactMap { $0[0] as? String } ?? []
  #endif
  }
}

/**
 Returns the PostScript names to register an alias for, for the file at the given url.

 A variable font file exposes each of the named instances of its variation axes under its own
 PostScript name. RN walks every name the family reports and keeps the one
 whose weight is closest to the requested one, so a name it cannot see is a weight it cannot pick:
 https://github.com/react/react-native/blob/v0.86.0/packages/react-native/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTFontUtils.mm#L372-L386

 Every other file resolves to the single name of its default font, which leaves the alias behaving
 as it did before variable fonts were handled: ``UIFont/_expo_fontNames(forFamilyName:)`` looks that
 name up as a family name, so fonts registered elsewhere under the same family stay reachable
 through the alias.
 */
internal func postScriptNames(inFileAt url: CFURL, alias: String) throws -> [String] {
  guard let fontDescriptors = CTFontManagerCreateFontDescriptorsFromURL(url) as? [CTFontDescriptor] else {
    throw FontCreationFailedException(alias)
  }

  var postScriptNames = fontDescriptors.compactMap { descriptor in
    return CTFontDescriptorCopyAttribute(descriptor, kCTFontNameAttribute) as? String
  }

  if postScriptNames.isEmpty {
    throw FontNoPostScriptException(alias)
  }

  // ``CGFont`` reports the PostScript name of the file's default instance, which is the one to
  // move up front.
  let defaultPostScriptName = defaultInstancePostScriptName(url: url)

  let hasVariationAxes = fontDescriptors.contains { descriptor in
    let axes = CTFontDescriptorCopyAttribute(descriptor, kCTFontVariationAxesAttribute) as? [Any]
    return !(axes?.isEmpty ?? true)
  }

  if hasVariationAxes, postScriptNames.count > 1 {
    // RN falls back to the first name when no font matches the requested traits (e.g. an
    // italic style against a font with only upright instances) so the first name has to be the default weight:
    // https://github.com/react/react-native/blob/v0.86.0/packages/react-native/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTFontUtils.mm#L388-L393
    // This lookup did not miss on any font tested — Inter, Roboto Flex, Roboto Serif, and one
    // with no named instance at the default location. `CTFontManagerCreateFontDescriptorsFromURL`
    // appears to always return a descriptor for the axes' default location, carrying the name
    // ``CGFont`` reports.
    if let defaultPostScriptName,
      let defaultIndex = postScriptNames.firstIndex(of: defaultPostScriptName) {
      postScriptNames.remove(at: defaultIndex)
      postScriptNames.insert(defaultPostScriptName, at: 0)
    }
    return postScriptNames
  }

  return [defaultPostScriptName ?? postScriptNames[0]]
}

/**
 The PostScript name ``CGFont`` reports for the file's default instance (its variation axes'
 default location), or `nil` when it can't be read. Shared by ``postScriptNames(inFileAt:alias:)``
 and ``fontTraits(inFileAt:)`` so both agree on which descriptor is the default one.
 */
internal func defaultInstancePostScriptName(url: CFURL) -> String? {
  return CGDataProvider(url: url).flatMap { CGFont($0)?.postScriptName as String? }
}

/**
 The italic flag and raw `kCTFontWeightTrait` (0.0 = regular, negative lighter, positive bolder)
 from the file's default-instance font descriptor (falling back to the first descriptor when the
 default instance's name can't be read or matched), or `nil` when the file has no readable traits.
 */
internal func fontTraits(inFileAt url: CFURL) -> (isItalic: Bool, weightTrait: CGFloat)? {
  guard let fontDescriptors = CTFontManagerCreateFontDescriptorsFromURL(url) as? [CTFontDescriptor],
    !fontDescriptors.isEmpty else {
    return nil
  }

  let defaultPostScriptName = defaultInstancePostScriptName(url: url)
  let descriptor = defaultPostScriptName.flatMap { defaultName in
    fontDescriptors.first { descriptor in
      (CTFontDescriptorCopyAttribute(descriptor, kCTFontNameAttribute) as? String) == defaultName
    }
  } ?? fontDescriptors[0]

  guard let traits = CTFontDescriptorCopyAttribute(descriptor, kCTFontTraitsAttribute) as? [String: Any] else {
    return nil
  }

  let symbolicTraits = (traits[kCTFontSymbolicTrait as String] as? NSNumber)?.uint32Value ?? 0
  let isItalic = symbolicTraits & CTFontSymbolicTraits.traitItalic.rawValue != 0
  let weightTrait = (traits[kCTFontWeightTrait as String] as? NSNumber)?.doubleValue ?? 0

  return (isItalic: isItalic, weightTrait: CGFloat(weightTrait))
}

/**
 Registers the given font to make it discoverable through font descriptor matching.
 */
internal func registerFont(fontUrl: CFURL, fontFamilyAlias: String) throws {
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
      throw FontRegistrationFailedException(FontRegistrationErrorInfo(fontFamilyAlias: fontFamilyAlias, cfError: error, ctFontManagerError: fontError))
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
      return switch ctFontManagerError {
      case .systemRequired, .inUse:
        false
      case .notRegistered:
        true
      default:
        throw UnregisteringFontFailedException(error)
      }
    }
  }
  return true
}
