import CoreGraphics
import ExpoModulesCore

public final class FontLoaderModule: Module {
  // could be a Set, but to be able to pass to JS we keep it as an array
  private lazy var registeredFonts: [String] = queryCustomNativeFonts()

  public func definition() -> ModuleDefinition {
    Name("ExpoFontLoader")

    // NOTE: this is exposed in JS as globalThis.expo.modules.ExpoFontLoader.loadedFonts
    // and potentially consumed outside of Expo (e.g. RN vector icons)
    // do NOT change the property as it'll break consumers!
    Function("getLoadedFonts") {
      return registeredFonts
    }

    // NOTE: this is exposed in JS as globalThis.expo.modules.ExpoFontLoader.loadAsync
    // and potentially consumed outside of Expo (e.g. RN vector icons)
    // do NOT change the function signature as it'll break consumers!
    AsyncFunction("loadAsync") { (fontFamilyAlias: String, localUri: URL) in
      let fontUrl = localUri as CFURL
      // If the font was already registered, unregister it first. Otherwise CTFontManagerRegisterFontsForURL
      // would fail because of a duplicated font name when the app reloads. Note that re-registering
      // under an existing alias is skipped in the JS layer.
      if FontFamilyAliasManager.hasAlias(fontFamilyAlias) {
        guard try unregisterFont(url: fontUrl) else {
          return
        }
      }

      try registerFont(fontUrl: fontUrl, fontFamilyAlias: fontFamilyAlias)

      // Alias every name the file provides to `fontFamilyAlias` — one per named instance for a
      // variable font — that makes its weights reachable through the `fontWeight` style prop.
      let aliasedNames = try postScriptNames(inFileAt: fontUrl, alias: fontFamilyAlias)

      FontFamilyAliasManager.setAlias(fontFamilyAlias, forPostScriptNames: aliasedNames, url: localUri)

      // Only report names the app supplied. This list is what `Font.isLoaded` answers from, and
      // what `loadAsync` skips on, so every entry takes a name the app can no longer load under.
      // The names read out of the file stay in the alias registry above, where `fontWeight`
      // resolution needs them.
      registeredFonts = Array(Set(registeredFonts).union([fontFamilyAlias]))
    }

    // Registers several font files under one alias so `fontWeight`/`fontStyle` pick between them.
    // RN falls back to the first reported name, so the regular upright face must end up first.
    AsyncFunction("loadFontFamilyAsync") { (fontFamilyAlias: String, faces: [FontFaceRecord]) in
      guard !faces.isEmpty else {
        throw FontFamilyEmptyFacesException(fontFamilyAlias)
      }

      var faceInfos = [FaceInfo]()

      for (index, face) in faces.enumerated() {
        guard let localUri = face.localUri else {
          throw FontFaceMissingUriException(fontFamilyAlias)
        }
        let fontUrl = localUri as CFURL

        // The registry survives JS reloads, so the same file may arrive again — unregister it
        // first. A failed unregister is fine: `registerFont` tolerates duplicates.
        if FontFamilyAliasManager.hasRegisteredUrl(localUri, forAlias: fontFamilyAlias) {
          _ = try unregisterFont(url: fontUrl)
        }

        try registerFont(fontUrl: fontUrl, fontFamilyAlias: fontFamilyAlias)

        let names = try postScriptNames(inFileAt: fontUrl, alias: fontFamilyAlias)
        FontFamilyAliasManager.setNames(names, forURL: localUri, alias: fontFamilyAlias)

        let traits = fontTraits(inFileAt: fontUrl)
        faceInfos.append(FaceInfo(
          url: localUri,
          index: index,
          isItalic: traits?.isItalic,
          weightTrait: traits?.weightTrait,
          jsWeight: face.weight ?? 400,
          jsIsItalic: face.style == "italic"
        ))
      }

      FontFamilyAliasManager.moveToFront(url: defaultFace(among: faceInfos).url, alias: fontFamilyAlias)

      // Report only the alias, matching `loadAsync`'s `getLoadedFonts` policy above.
      registeredFonts = Array(Set(registeredFonts).union([fontFamilyAlias]))
    }
  }
}

/**
 Per-face info used to pick the family's default face.
 */
private struct FaceInfo {
  let url: URL
  let index: Int
  let isItalic: Bool?
  let weightTrait: CGFloat?
  let jsWeight: Int
  let jsIsItalic: Bool
}

/**
 The face RN falls back to when nothing matches: the upright face closest to a regular weight by
 file traits, or by the JS-declared values when no file has readable traits.
 */
private func defaultFace(among faces: [FaceInfo]) -> FaceInfo {
  let readable: [(face: FaceInfo, isItalic: Bool, weightTrait: CGFloat)] = faces.compactMap { face in
    guard let isItalic = face.isItalic, let weightTrait = face.weightTrait else {
      return nil
    }
    return (face, isItalic, weightTrait)
  }

  if !readable.isEmpty {
    let best = readable.min { lhs, rhs in
      (lhs.isItalic ? 1 : 0, abs(lhs.weightTrait), lhs.face.index) <
        (rhs.isItalic ? 1 : 0, abs(rhs.weightTrait), rhs.face.index)
    }
    return best?.face ?? faces[0]
  }

  let fallback = faces.min { lhs, rhs in
    let lhsDistance = abs(lhs.jsWeight - 400)
    let rhsDistance = abs(rhs.jsWeight - 400)
    if lhsDistance != rhsDistance {
      return lhsDistance < rhsDistance
    }
    if lhs.jsIsItalic != rhs.jsIsItalic {
      // Prefer the non-italic face when both are equally close to a regular weight.
      return !lhs.jsIsItalic
    }
    return lhs.index < rhs.index
  }
  return fallback ?? faces[0]
}
