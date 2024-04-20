import ExpoModulesCore

public enum TintStyle: String, Enumerable {
  case `default`
  case extraLight
  case light
  case dark
  case regular
  case prominent
  case systemUltraThinMaterial
  case systemThinMaterial
  case systemMaterial
  case systemThickMaterial
  case systemChromeMaterial
  case systemUltraThinMaterialLight
  case systemThinMaterialLight
  case systemMaterialLight
  case systemThickMaterialLight
  case systemChromeMaterialLight
  case systemUltraThinMaterialDark
  case systemThinMaterialDark
  case systemMaterialDark
  case systemThickMaterialDark
  case systemChromeMaterialDark

  func toBlurEffect() -> UIBlurEffect.Style {
#if os(tvOS)
    switch self {
    case .default:
      return .regular
    case .extraLight:
      return .extraLight
    case .light:
      return .light
    case .regular:
      return .regular
    case .dark:
      return .dark
    case .prominent:
      return .prominent
    case .systemUltraThinMaterial:
      return .regular
    case .systemThinMaterial:
      return .regular
    case .systemMaterial:
      return .regular
    case .systemThickMaterial:
      return .regular
    case .systemChromeMaterial:
      return .regular
    case .systemUltraThinMaterialLight:
      return .light
    case .systemThinMaterialLight:
      return .light
    case .systemMaterialLight:
      return .light
    case .systemThickMaterialLight:
      return .light
    case .systemChromeMaterialLight:
      return .light
    case .systemUltraThinMaterialDark:
      return .dark
    case .systemThinMaterialDark:
      return .dark
    case .systemMaterialDark:
      return .dark
    case .systemThickMaterialDark:
      return .dark
    case .systemChromeMaterialDark:
      return .dark
    }
#else
    switch self {
    case .default:
      return .regular
    case .extraLight:
      return .extraLight
    case .light:
      return .light
    case .regular:
      return .regular
    case .dark:
      return .dark
    case .prominent:
      return .prominent
    case .systemUltraThinMaterial:
      return .systemUltraThinMaterial
    case .systemThinMaterial:
      return .systemThinMaterial
    case .systemMaterial:
      return .systemMaterial
    case .systemThickMaterial:
      return .systemThickMaterial
    case .systemChromeMaterial:
      return .systemChromeMaterial
    case .systemUltraThinMaterialLight:
      return .systemUltraThinMaterialLight
    case .systemThickMaterialLight:
      return .systemThickMaterialLight
    case .systemThinMaterialLight:
      return .systemThinMaterialLight
    case .systemMaterialLight:
      return .systemMaterialLight
    case .systemChromeMaterialLight:
      return .systemChromeMaterialLight
    case .systemUltraThinMaterialDark:
      return .systemUltraThinMaterialDark
    case .systemThinMaterialDark:
      return .systemThinMaterialDark
    case .systemMaterialDark:
      return .systemMaterialDark
    case .systemThickMaterialDark:
      return .systemThickMaterialDark
    case .systemChromeMaterialDark:
      return .systemChromeMaterialDark
    }
#endif
  }
}
