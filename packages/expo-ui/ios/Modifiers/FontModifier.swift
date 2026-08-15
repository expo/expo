// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum FontWeight: String, Enumerable {
  case ultraLight
  case thin
  case light
  case regular
  case medium
  case semibold
  case bold
  case heavy
  case black

  func toSwiftUI() -> Font.Weight {
    switch self {
    case .ultraLight: .ultraLight
    case .thin: .thin
    case .light: .light
    case .regular: .regular
    case .medium: .medium
    case .semibold: .semibold
    case .bold: .bold
    case .heavy: .heavy
    case .black: .black
    }
  }
}

internal enum FontDesign: String, Enumerable {
  case `default`
  case rounded
  case serif
  case monospaced

  func toSwiftUI() -> Font.Design {
    switch self {
    case .default: .default
    case .rounded: .rounded
    case .serif: .serif
    case .monospaced: .monospaced
    }
  }
}

internal enum FontTextStyle: String, Enumerable {
  case largeTitle
  case title
  case title2
  case title3
  case headline
  case subheadline
  case body
  case callout
  case footnote
  case caption
  case caption2

  func toSwiftUI() -> Font.TextStyle {
    switch self {
    case .largeTitle: .largeTitle
    case .title: .title
    case .title2: .title2
    case .title3: .title3
    case .headline: .headline
    case .subheadline: .subheadline
    case .body: .body
    case .callout: .callout
    case .footnote: .footnote
    case .caption: .caption
    case .caption2: .caption2
    }
  }
}

internal struct FontModifier: ViewModifier, Record {
  @Field var family: String?
  @Field var size: CGFloat?
  @Field var weight: FontWeight?
  @Field var design: FontDesign?
  @Field var textStyle: FontTextStyle?

  func body(content: Content) -> some View {
    content.font(resolveFont())
  }

  // Shared so the Text-concatenation path (`applyTextModifier`) resolves the
  // same `Font` as the view path, instead of a fixed-size `Font.custom` that
  // drops `relativeTo` (Dynamic Type) and `weight`.
  func resolveFont() -> Font {
    if let family = family {
      let baseSize = size ?? 17
      var font: Font = if let textStyle = textStyle {
        Font.custom(family, size: baseSize, relativeTo: textStyle.toSwiftUI())
      } else {
        Font.custom(family, size: baseSize)
      }
      if let weight = weight {
        font = font.weight(weight.toSwiftUI())
      }
      return font
    }

    if let textStyle = textStyle {
      var font = Font.system(textStyle.toSwiftUI(), design: design?.toSwiftUI() ?? .default)
      if let weight = weight {
        font = font.weight(weight.toSwiftUI())
      }
      return font
    }

    return .system(
      size: size ?? 17,
      weight: weight?.toSwiftUI() ?? .regular,
      design: design?.toSwiftUI() ?? .default
    )
  }
}
