import ExpoModulesCore

/**
 A registry of font family aliases mapped to their real font family names.
 */
private var fontFamilyAliases = [String: String]()

/**
 A flag that is set to `true` when the ``UIFont.fontNames(forFamilyName:)`` is already swizzled.
 */
private var hasSwizzled = false

/**
 Manages the font family aliases and swizzles the `UIFont` class.
 */
internal struct FontFamilyAliasManager {
  /**
   Whether the given alias has already been set.
   */
  internal static func hasAlias(_ familyNameAlias: String) -> Bool {
    return fontFamilyAliases[familyNameAlias] != nil
  }

  /**
   Sets the alias for the given family name.
   If the alias has already been set, its family name will be overriden.
   */
  internal static func setAlias(_ familyNameAlias: String, forFamilyName familyName: String) {
    maybeSwizzleUIFont()
    fontFamilyAliases[familyNameAlias] = familyName
  }

  /**
   Returns the family name for the given alias or `nil` when it's not set yet.
   */
  internal static func familyName(forAlias familyNameAlias: String) -> String? {
    return fontFamilyAliases[familyNameAlias]
  }
}

/**
 Swizzles ``UIFont.fontNames(forFamilyName:)`` and ``UIFont(name:size:)`` to support font family aliases.
 This is necessary because the user provides a custom family name that is then used in stylesheets,
 however the font usually has a different name encoded in the binary, thus the system may use a different name.

 ``UIFont(name:size:)`` covers cases where there the font family has variants. For example, the ``CGFont fullName``
 value for "Helvetica-Light-Oblique.ttf" would be something like "Helvetica Light Oblique", which
 ``UIFont.fullNames`` won't recognize, because that is a font name rather than a font family name. We have to use
 ``UIFont(name:size:)`` instead, because it accepts a font name. React Native does this looking up / falling back
 for us, we just need to ensure both methods are swizzled so they both support aliasing.
 */
private func maybeSwizzleUIFont() {
  if hasSwizzled {
    return
  }
  let originalFontNamesMethod = class_getClassMethod(UIFont.self, #selector(UIFont.fontNames(forFamilyName:)))
  let newFontNamesMethod = class_getClassMethod(UIFont.self, #selector(UIFont._expo_fontNames(forFamilyName:)))

  if let originalFontNamesMethod, let newFontNamesMethod {
    method_exchangeImplementations(originalFontNamesMethod, newFontNamesMethod)
  } else {
    log.error("expo-font is unable to swizzle `UIFont.fontNames(forFamilyName:)`")
  }
  let originalInitMethod = class_getClassMethod(UIFont.self, #selector(UIFont.init(name:size:)))
  let newInitMethod = class_getClassMethod(UIFont.self, #selector(UIFont._expo_init(name:size:)))

  if let originalInitMethod, let newInitMethod {
    method_exchangeImplementations(originalInitMethod, newInitMethod)
  } else {
    log.error("expo-font is unable to swizzle `UIFont.init(name:size:)`")
  }
  hasSwizzled = true
}
