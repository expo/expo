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

    // RN falls back to the first name, so the alias's names must stay in default-face-first order.
    let aliasedFontNames = FontFamilyAliasManager.postScriptNames(forAlias: familyName)

    // Expanding as a family name only makes sense for a single-face alias: a multi-face alias's
    // name could match an unrelated CoreText family and its order would override ours.
    let canExpandAsFamily = FontFamilyAliasManager.hasSingleFace(forAlias: familyName)

    var result = [String]()
    for name in aliasedFontNames {
      let expanded = canExpandAsFamily ? UIFont._expo_fontNames(forFamilyName: name) : []
      for expandedName in expanded.isEmpty ? [name] : expanded where !result.contains(expandedName) {
        result.append(expandedName)
      }
    }
    return result
  }
}
#endif
