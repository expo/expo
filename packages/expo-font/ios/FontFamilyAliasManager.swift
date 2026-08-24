import ExpoModulesCore

/**
 Maps each alias to its registered faces, in order. The default face is kept first.
 */
private var fontFamilyAliases = [String: [(url: URL, names: [String])]]()

/**
 Queue to protect shared resources.
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
      !(fontFamilyAliases[familyNameAlias]?.isEmpty ?? true)
    }
  }

  internal static func hasRegisteredUrl(_ url: URL, forAlias familyNameAlias: String) -> Bool {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]?.contains { $0.url == url } ?? false
    }
  }

  /**
   Full replacement, in order — `loadFontFamilyAsync`'s "last call wins" contract.
   */
  internal static func setFaces(_ faces: [(url: URL, names: [String])], alias familyNameAlias: String) {
    maybeSwizzleUIFont()
    queue.sync(flags: .barrier) {
      fontFamilyAliases[familyNameAlias] = faces
    }
  }

  /**
   Replaces the alias's whole entry with this one font — `loadAsync`'s "last call wins" contract.
   */
  internal static func setAlias(
    _ familyNameAlias: String,
    forPostScriptNames postScriptNames: [String],
    url: URL
  ) {
    setFaces([(url: url, names: postScriptNames)], alias: familyNameAlias)
  }

  internal static func postScriptNames(forAlias familyNameAlias: String) -> [String] {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]?.flatMap { $0.names } ?? []
    }
  }

  internal static func registeredUrls(forAlias familyNameAlias: String) -> [URL] {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]?.map { $0.url } ?? []
    }
  }

  internal static func hasSingleFace(forAlias familyNameAlias: String) -> Bool {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]?.count == 1
    }
  }
}

/**
 Swizzles ``UIFont.fontNames(forFamilyName:)`` to support font family aliases. RN core asks for a family's font faces (postScript names) to pick from:
 https://github.com/react/react-native/blob/v0.86.0/packages/react-native/ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTFontUtils.mm#L359

 A top-level `let` initializes at most once even under concurrent access, so the swizzle can't
 run twice.
 */
private let swizzleUIFontOnce: Void = {
#if !os(macOS)
  let originalFontNamesMethod = class_getClassMethod(UIFont.self, #selector(UIFont.fontNames(forFamilyName:)))
  let newFontNamesMethod = class_getClassMethod(UIFont.self, #selector(UIFont._expo_fontNames(forFamilyName:)))

  if let originalFontNamesMethod, let newFontNamesMethod {
    method_exchangeImplementations(originalFontNamesMethod, newFontNamesMethod)
  } else {
    log.error("expo-font is unable to swizzle `UIFont.fontNames(forFamilyName:)`")
  }
#endif
}()

private func maybeSwizzleUIFont() {
  _ = swizzleUIFontOnce
}
