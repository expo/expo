import ExpoModulesCore

public final class FontLoaderModule: Module {
  // could be a Set, but to be able to pass to JS we keep it as an array
  private lazy var registeredFonts: [String] = queryCustomNativeFonts()

  public required init(appContext: AppContext) {
    super.init(appContext: appContext)
  }

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
      // would fail because of a duplicated font name when the app reloads or someone wants to override a font. Note that re-registering under an existing alias is skipped in the JS layer.
      if FontFamilyAliasManager.hasAlias(fontFamilyAlias) {
        guard try unregisterFont(url: fontUrl) else {
          return
        }
      }

      try registerFont(fontUrl: fontUrl, fontFamilyAlias: fontFamilyAlias)

      // Alias every name the file provides to `fontFamilyAlias` — one per named instance for a variable font — that makes its weights reachable through `fontWeight` style prop.
      let aliasedNames = try postScriptNames(inFileAt: fontUrl, alias: fontFamilyAlias)

      FontFamilyAliasManager.setAlias(fontFamilyAlias, forPostScriptNames: aliasedNames)

      registeredFonts = Array(Set(registeredFonts).union([aliasedNames[0], fontFamilyAlias]))
    }
  }
}
