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
 Swizzles ``UIFont.fontNames(forFamilyName:)`` to support font family aliases.
 This is necessary because the user provides a custom family name that is then used in stylesheets,
 however the font usually has a different name encoded in the binary, thus the system may use a different name.
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
  hasSwizzled = true
}
