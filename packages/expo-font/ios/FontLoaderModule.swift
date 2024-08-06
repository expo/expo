import ExpoModulesCore

public final class FontLoaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoFontLoader")

    Property("customNativeFonts") {
      return queryCustomNativeFonts()
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
    }
  }
}
