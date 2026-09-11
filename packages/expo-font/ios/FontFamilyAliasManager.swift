import ExpoModulesCore

/**
 Maps each font family alias to the PostScript names of the fonts in the file it was registered for.
 A file usually provides one name. A variable font provides one per named instance, which is what
 lets `fontWeight` reach the weights it declares.
 */
private var fontFamilyAliases = [String: [String]]()

/**
 A flag that is set to `true` when the ``UIFont.fontNames(forFamilyName:)`` is already swizzled.
 */
private var hasSwizzled = false

/**
 Queue to protect shared resources
 */
private let queue = DispatchQueue(label: "expo.fontfamilyaliasmanager", attributes: .concurrent)

/**
 Manages the font family aliases and swizzles the `UIFont` class.
 */
internal struct FontFamilyAliasManager {
  /**
   Whether the given alias has already been set.
   */
  internal static func hasAlias(_ familyNameAlias: String) -> Bool {
    return queue.sync {
      fontFamilyAliases[familyNameAlias] != nil
    }
  }

  /**
   Sets the alias for the given PostScript names.
   If the alias has already been set, its PostScript names will be overridden.
   */
  internal static func setAlias(_ familyNameAlias: String, forPostScriptNames postScriptNames: [String]) {
    maybeSwizzleUIFont()
    queue.sync(flags: .barrier) {
      fontFamilyAliases[familyNameAlias] = postScriptNames
    }
  }

  /**
   Returns the PostScript names for the given alias or `nil` when it's not set yet.
   */
  internal static func postScriptNames(forAlias familyNameAlias: String) -> [String]? {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]
    }
  }
}

/**
 Swizzles ``UIFont.fontNames(forFamilyName:)`` to support font family aliases. RN core asks for a family's font faces (postScript names) to pick from:
 https://github.com/react/react-native/blob/v0.86.0/packages/react-native/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTFontUtils.mm#L359
 */
private func maybeSwizzleUIFont() {
  if hasSwizzled {
    return
  }
#if !os(macOS)
  let originalFontNamesMethod = class_getClassMethod(UIFont.self, #selector(UIFont.fontNames(forFamilyName:)))
  let newFontNamesMethod = class_getClassMethod(UIFont.self, #selector(UIFont._expo_fontNames(forFamilyName:)))

  if let originalFontNamesMethod, let newFontNamesMethod {
    method_exchangeImplementations(originalFontNamesMethod, newFontNamesMethod)
  } else {
    log.error("expo-font is unable to swizzle `UIFont.fontNames(forFamilyName:)`")
  }
#endif
  hasSwizzled = true
}
