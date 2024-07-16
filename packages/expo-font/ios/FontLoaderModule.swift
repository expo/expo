import ExpoModulesCore

public final class FontLoaderModule: Module {
  private let customNativeFonts: [String]
  // could be a Set, but to be able to pass to JS we keep it as an array
  private var registeredFonts: [String]

  public required init(appContext: AppContext) {
    let nativeFonts = queryCustomNativeFonts()
    self.customNativeFonts = nativeFonts
    self.registeredFonts = nativeFonts
    super.init(appContext: appContext)
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoFontLoader")

    Constants([
      "customNativeFonts": self.customNativeFonts
    ])

    Property("loadedFonts") {
      return registeredFonts
    }

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
      try registerFont(fontUrl)

      // Create a font object from the given URL
      let font = try loadFont(fromUrl: fontUrl, alias: fontFamilyAlias)

      if let postScriptName = font.postScriptName as? String {
        FontFamilyAliasManager.setAlias(fontFamilyAlias, forFont: postScriptName)
      }

      registeredFonts = Array(Set(registeredFonts).union([fontFamilyAlias]))
    }
  }
}
