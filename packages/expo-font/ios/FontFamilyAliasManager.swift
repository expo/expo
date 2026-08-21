import ExpoModulesCore

/**
 Maps each alias to its registered faces: the font file `url` and the PostScript `names` in it
 (one per named instance for a variable font). The default (regular, upright) face is kept first.
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

  /**
   Whether `alias` already has a face registered for the given font file `url`.
   */
  internal static func hasRegisteredUrl(_ url: URL, forAlias familyNameAlias: String) -> Bool {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]?.contains { $0.url == url } ?? false
    }
  }

  /**
   Replaces the alias's whole entry with this one font — `loadAsync`'s "last call wins" contract,
   unlike the per-face `setNames`.
   */
  internal static func setAlias(
    _ familyNameAlias: String,
    forPostScriptNames postScriptNames: [String],
    url: URL
  ) {
    maybeSwizzleUIFont()
    queue.sync(flags: .barrier) {
      fontFamilyAliases[familyNameAlias] = [(url: url, names: postScriptNames)]
    }
  }

  /**
   Records the file's `names` as a face of `alias`. A face with the same `url` is replaced in
   place, so re-registering it (e.g. after a JS reload) doesn't duplicate the face.
   */
  internal static func setNames(_ names: [String], forURL url: URL, alias familyNameAlias: String) {
    maybeSwizzleUIFont()
    queue.sync(flags: .barrier) {
      var faces = fontFamilyAliases[familyNameAlias] ?? []
      if let index = faces.firstIndex(where: { $0.url == url }) {
        faces[index] = (url: url, names: names)
      } else {
        faces.append((url: url, names: names))
      }
      fontFamilyAliases[familyNameAlias] = faces
    }
  }

  /**
   Moves the face registered for `url` to the front, making its names the first ones reported.
   */
  internal static func moveToFront(url: URL, alias familyNameAlias: String) {
    queue.sync(flags: .barrier) {
      guard var faces = fontFamilyAliases[familyNameAlias],
        let index = faces.firstIndex(where: { $0.url == url }),
        index != 0 else {
        return
      }
      let face = faces.remove(at: index)
      faces.insert(face, at: 0)
      fontFamilyAliases[familyNameAlias] = faces
    }
  }

  /**
   All PostScript names registered for the alias, in face order.
   */
  internal static func postScriptNames(forAlias familyNameAlias: String) -> [String] {
    return queue.sync {
      fontFamilyAliases[familyNameAlias]?.flatMap { $0.names } ?? []
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
