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

      let previousUrls = FontFamilyAliasManager.registeredUrls(forAlias: fontFamilyAlias)

      FontFamilyAliasManager.setAlias(fontFamilyAlias, forPostScriptNames: aliasedNames, url: localUri)

      // A file no longer aliased stays registered with CoreText otherwise. A failed unregister
      // is fine: `registerFont` tolerates duplicates.
      for staleUrl in previousUrls where !FontFamilyAliasManager.hasRegisteredUrl(staleUrl) {
        _ = try? unregisterFont(url: staleUrl as CFURL)
      }

      // Only report names the app supplied. This list is what `Font.isLoaded` answers from, and
      // what `loadAsync` skips on, so every entry takes a name the app can no longer load under.
      // The names read out of the file stay in the alias registry above, where `fontWeight`
      // resolution needs them.
      registeredFonts = Array(Set(registeredFonts).union([fontFamilyAlias]))
    }

    AsyncFunction("loadFontFamilyAsync") { (fontFamilyAlias: String, faces: [FontFaceRecord]) in
      try self.loadFontFamily(alias: fontFamilyAlias, faces: faces)
    }
  }

  private func loadFontFamily(alias fontFamilyAlias: String, faces: [FontFaceRecord]) throws {
    guard !faces.isEmpty else {
      throw FontFamilyEmptyFacesException(fontFamilyAlias)
    }

    let previousUrls = FontFamilyAliasManager.registeredUrls(forAlias: fontFamilyAlias)

    // No alias-registry writes in the loop: a face that throws partway through must not leave
    // a partial, unordered family committed.
    var faceEntries = [(url: URL, names: [String])]()
    var faceInfos = [FaceInfo]()
    var seenUrls = Set<URL>()

    for (index, face) in faces.enumerated() {
      guard let localUri = face.localUri else {
        throw FontFaceMissingUriException(fontFamilyAlias)
      }

      guard seenUrls.insert(localUri).inserted else {
        continue
      }
      let fontUrl = localUri as CFURL

      // The registry survives JS reloads, so the same file may arrive again; unregister it first.
      if FontFamilyAliasManager.hasRegisteredUrl(localUri, forAlias: fontFamilyAlias) {
        _ = try? unregisterFont(url: fontUrl)
      }

      try registerFont(fontUrl: fontUrl, fontFamilyAlias: fontFamilyAlias)

      let names = try postScriptNames(inFileAt: fontUrl, alias: fontFamilyAlias)
      faceEntries.append((url: localUri, names: names))

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

    guard let chosenDefault = defaultFace(among: faceInfos) else {
      throw FontFamilyEmptyFacesException(fontFamilyAlias)
    }
    if let defaultIndex = faceEntries.firstIndex(where: { $0.url == chosenDefault.url }), defaultIndex != 0 {
      let defaultEntry = faceEntries.remove(at: defaultIndex)
      faceEntries.insert(defaultEntry, at: 0)
    }
    FontFamilyAliasManager.setFaces(faceEntries, alias: fontFamilyAlias)

    for staleUrl in previousUrls where !FontFamilyAliasManager.hasRegisteredUrl(staleUrl) {
      _ = try? unregisterFont(url: staleUrl as CFURL)
    }

    registeredFonts = Array(Set(registeredFonts).union([fontFamilyAlias]))
  }
}

private struct FaceInfo {
  let url: URL
  let index: Int
  let isItalic: Bool?
  let weightTrait: CGFloat?
  let jsWeight: Int
  let jsIsItalic: Bool
}

private struct ReadableFace {
  let face: FaceInfo
  let isItalic: Bool
  let weightTrait: CGFloat
}

/**
 Ranks by the traits read from the files only when every face's traits are readable — otherwise
 ranks the whole family by the JS-declared weight and style, so one file with unreadable traits
 can't make a readable file win unfairly.
 */
private func defaultFace(among faces: [FaceInfo]) -> FaceInfo? {
  guard let firstFace = faces.first else {
    return nil
  }

  let readable: [ReadableFace] = faces.compactMap { face in
    guard let isItalic = face.isItalic, let weightTrait = face.weightTrait else {
      return nil
    }
    return ReadableFace(face: face, isItalic: isItalic, weightTrait: weightTrait)
  }

  if readable.count == faces.count {
    let best = readable.min { lhs, rhs in
      (abs(lhs.weightTrait), lhs.isItalic ? 1 : 0, lhs.face.index) <
        (abs(rhs.weightTrait), rhs.isItalic ? 1 : 0, rhs.face.index)
    }
    return best?.face ?? firstFace
  }

  let fallback = faces.min { lhs, rhs in
    let lhsDistance = abs(lhs.jsWeight - 400)
    let rhsDistance = abs(rhs.jsWeight - 400)
    if lhsDistance != rhsDistance {
      return lhsDistance < rhsDistance
    }
    if lhs.jsIsItalic != rhs.jsIsItalic {
      return !lhs.jsIsItalic
    }
    return lhs.index < rhs.index
  }
  return fallback ?? firstFace
}
