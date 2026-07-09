#if !os(macOS)
import UIKit

/**
 An extension to ``UIFont`` that adds a custom implementation of `fontNames(forFamilyName:)` that supports aliasing font families.
 */
public extension UIFont {
  /**
   Returns an array of font names for the specified family name or its alias.

   "Font names" is UIKit's term for what the rest of this module calls PostScript names — one per
   face. An alias resolves to the names registered under it; see ``FontFamilyAliasManager.postScriptNames(inFileAt:alias:)``.
   */
  @objc
  static dynamic func _expo_fontNames(forFamilyName familyName: String) -> [String] {
    // Get font names from the original function.
    let fontNames = UIFont._expo_fontNames(forFamilyName: familyName)

    // If no font names were found, let's try with the alias.
    if fontNames.isEmpty, let aliasedFontNames = FontFamilyAliasManager.postScriptNames(forAlias: familyName) {
      // Only a variable font stored more than one name: ``postScriptNames(inFileAt:alias:)`` records one
      // per named instance for those, and a single name for every other file. Handing the whole set
      // back is what lets RN match `fontWeight` against the weights the font really has.
      if aliasedFontNames.count > 1 {
        return aliasedFontNames
      }

      // Every other font keeps the original lookup: the PostScript name is tried as a family name
      // first, so faces already registered under that family stay reachable through the alias.
      // The postScriptName itself is returned when it is not a family name.
      if let postScriptName = aliasedFontNames.first {
        let familyFontNames = UIFont._expo_fontNames(forFamilyName: postScriptName)
        return familyFontNames.isEmpty ? [postScriptName] : familyFontNames
      }
    }

    return fontNames
  }
}
#endif
