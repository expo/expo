/**
 An extension to ``UIFont`` that adds a custom implementation of `fontNames(forFamilyName:)` that supports aliasing font families.
 */
public extension UIFont {
  /**
   Returns an array of font names for the specified family name or its alias.
   */
  @objc
  static dynamic func _expo_fontNames(forFamilyName familyName: String) -> [String] {
    let fontNames = UIFont._expo_fontNames(forFamilyName: familyName)

    if fontNames.isEmpty, let aliasedFamilyName = FontFamilyAliasManager.familyName(forAlias: familyName) {
      // Note that this actually calls the original method implementation (if swizzled).
      return UIFont._expo_fontNames(forFamilyName: aliasedFamilyName)
    }
    return fontNames
  }
  @objc
  static dynamic func _expo_init(name fontName: String, size fontSize: CGFloat) -> UIFont? {
    let font = UIFont._expo_init(name: fontName, size: fontSize)

    if let aliasedFamilyName = FontFamilyAliasManager.familyName(forAlias: fontName) {
      return UIFont._expo_init(name: aliasedFamilyName, size: fontSize)
    }
    return font
  }
}
