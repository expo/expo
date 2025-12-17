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

internal struct FontModifier: ViewModifier, Record {
  @Field var family: String?
  @Field var size: CGFloat?
  @Field var weight: FontWeight?
  @Field var design: FontDesign?

  func body(content: Content) -> some View {
    if let family = family {
      content.font(Font.custom(family, size: size ?? 17))
    } else {
      content.font(.system(
        size: size ?? 17,
        weight: weight?.toSwiftUI() ?? .regular,
        design: design?.toSwiftUI() ?? .default
      ))
    }
  }
}
