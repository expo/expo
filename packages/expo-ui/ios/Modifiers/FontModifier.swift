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
    case .ultraLight: return .ultraLight
    case .thin: return .thin
    case .light: return .light
    case .regular: return .regular
    case .medium: return .medium
    case .semibold: return .semibold
    case .bold: return .bold
    case .heavy: return .heavy
    case .black: return .black
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
    case .default: return .default
    case .rounded: return .rounded
    case .serif: return .serif
    case .monospaced: return .monospaced
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
    case .largeTitle: return .largeTitle
    case .title: return .title
    case .title2: return .title2
    case .title3: return .title3
    case .headline: return .headline
    case .subheadline: return .subheadline
    case .body: return .body
    case .callout: return .callout
    case .footnote: return .footnote
    case .caption: return .caption
    case .caption2: return .caption2
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

  private func resolveFont() -> Font {
    if let family = family {
      let baseSize = size ?? 17
      var font: Font
      if let textStyle = textStyle {
        font = Font.custom(family, size: baseSize, relativeTo: textStyle.toSwiftUI())
      } else {
        font = Font.custom(family, size: baseSize)
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
