import ExpoModulesCore

enum CornerStyle: String, Enumerable {
  case dynamic
  case fixed
  case capsule
  case large
  case medium
  case small

  @available(iOS 16.0, *)
  func toCornerStyle() -> UIButton.Configuration.CornerStyle {
    switch self {
    case .dynamic:
      return .dynamic
    case .fixed:
      return .fixed
    case .capsule:
      return .capsule
    case .large:
      return .large
    case .medium:
      return .medium
    case .small:
      return .small
    }
  }
}

enum DisplayMode: String, Enumerable {
  case iconAndLabel
  case iconOnly
  case labelOnly

  @available(iOS 16.0, *)
  func toUIDisplayMode() -> UIPasteControl.DisplayMode {
    switch self {
    case .iconOnly:
      return .iconOnly
    case .labelOnly:
      return .labelOnly
    case .iconAndLabel:
      return .iconAndLabel
    }
  }
}

enum AcceptedTypes: String, Enumerable {
  case plainText = "plain-text"
  case url
  case html
  case image

  func typeIdentifier() -> String {
    switch self {
    case .plainText:
      return UTType.utf8PlainText.identifier
    case .html:
      return UTType.html.identifier
    case .image:
      return UTType.image.identifier
    case .url:
      return UTType.url.identifier
    }
  }
}
