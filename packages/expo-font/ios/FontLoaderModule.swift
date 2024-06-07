import ExpoModulesCore

public final class FontLoaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoFontLoader")

    Property("customNativeFonts") {
      return queryCustomNativeFonts()
    }

    AsyncFunction("loadAsync") { (fontFamilyAlias: String, localUri: URL) in
      // If the font was already registered, unregister it first. Otherwise CTFontManagerRegisterGraphicsFont
      // would fail because of a duplicated font name when the app reloads or someone wants to override a font.
      if let familyName = FontFamilyAliasManager.familyName(forAlias: fontFamilyAlias) {
        guard try unregisterFont(named: familyName) else {
          return
        }
      }

      // Create a font object from the given file
      let font = try loadFont(fromPath: localUri.path, alias: fontFamilyAlias)

      // Register the font
      try registerFont(font)

      // The real font name might be different than it's been requested by the user,
      // so we save the provided name as an alias.
      if let postScriptName = font.postScriptName as? String {
        FontFamilyAliasManager.setAlias(fontFamilyAlias, forFamilyName: postScriptName)
      }
    }
  }
}
