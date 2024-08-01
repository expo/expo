/**
 An extension to ``UIFont`` that adds a custom implementation of `fontNames(forFamilyName:)` that supports aliasing font families.
 */
public extension UIFont {
  /**
   Returns an array of font names for the specified family name or its alias.
   */
  @objc
  static dynamic func _expo_fontNames(forFamilyName familyName: String) -> [String] {
    // Get font names from the original function.
    let fontNames = UIFont._expo_fontNames(forFamilyName: familyName)

    // If no font names were found, let's try with the alias.
    if fontNames.isEmpty, let postScriptName = FontFamilyAliasManager.familyName(forAlias: familyName) {
      let fontNames = UIFont._expo_fontNames(forFamilyName: postScriptName)

      // If we still don't find any font names, we can assume it was not a family name but a font name.
      // In that case we can safely return the original font name.
      if fontNames.isEmpty {
        return [postScriptName]
      }
      return fontNames
    }

    return fontNames
  }
}
