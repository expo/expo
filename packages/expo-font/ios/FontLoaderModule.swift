import ExpoModulesCore

public final class FontLoaderModule: Module {
  // could be a Set, but to be able to pass to JS we keep it as an array
  private var registeredFonts: [String]

  public required init(appContext: AppContext) {
    self.registeredFonts = queryCustomNativeFonts()
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
      // would fail because of a duplicated font name when the app reloads or someone wants to override a font.
      if FontFamilyAliasManager.familyName(forAlias: fontFamilyAlias) != nil {
        guard try unregisterFont(url: fontUrl) else {
          return
        }
      }

      // Register the font
      try registerFont(fontUrl: fontUrl, fontFamilyAlias: fontFamilyAlias)

      // Create a font object from the given URL
      let font = try loadFont(fromUrl: fontUrl, alias: fontFamilyAlias)

      if let postScriptName = font.postScriptName as? String {
        FontFamilyAliasManager.setAlias(fontFamilyAlias, forFont: postScriptName)
        registeredFonts = Array(Set(registeredFonts).union([postScriptName, fontFamilyAlias]))
      } else {
        throw FontNoPostScriptException(fontFamilyAlias)
      }
    }
  }
}
