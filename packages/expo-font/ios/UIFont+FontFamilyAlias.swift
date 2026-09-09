#if !os(macOS)
/**
 An extension to ``UIFont`` that adds a custom implementation of `fontNames(forFamilyName:)` that supports aliasing font families.
 */
public extension UIFont {
  /**
   Returns an array of font names for the specified family name or its alias.

   "Font names" is UIKit's term for what the rest of this module calls PostScript names — one per
   face. An alias resolves to the names registered under it; see ``FontFamilyAliasManager.postScriptNames(forAlias:)``.
   */
  @objc
  static dynamic func _expo_fontNames(forFamilyName familyName: String) -> [String] {
    // Get font names from the original function.
    let fontNames = UIFont._expo_fontNames(forFamilyName: familyName)

    if !fontNames.isEmpty {
      return fontNames
    }

    // Nothing under that name directly, so try the alias. It may carry several faces, the
    // default face's names first — RN falls back to the first name, so preserve the order.
    let aliasedFontNames = FontFamilyAliasManager.postScriptNames(forAlias: familyName)

    var result = [String]()
    for name in aliasedFontNames {
      // Try each name as a family name so faces registered under it stay reachable; a name that
      // isn't one (e.g. a variable font's named instance) is kept as-is.
      let expanded = UIFont._expo_fontNames(forFamilyName: name)
      for expandedName in expanded.isEmpty ? [name] : expanded where !result.contains(expandedName) {
        result.append(expandedName)
      }
    }
    return result
  }
}
#endif
