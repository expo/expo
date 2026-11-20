// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ButtonBorderShapeType: String, UIEnum {
  case automatic
  case capsule
  case roundedRectangle
  case circle
}

@MainActor @AnyViewBuilder
internal func buttonBorderShapeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let shape: ButtonBorderShapeType = try p.value("shape", .automatic)
  let cornerRadius: CGFloat? = try p.value("cornerRadius", nil)
  switch shape {
  case .automatic:
    content.buttonBorderShape(.automatic)
  case .capsule:
    if #available(iOS 15.0, macOS 14.0, tvOS 17.0, *) {
      content.buttonBorderShape(.capsule)
    } else {
      content.buttonBorderShape(.automatic)
    }
  case .roundedRectangle:
    if #available(iOS 15.0, macOS 14.0, tvOS 17.0, *) {
      if let cornerRadius {
        content.buttonBorderShape(.roundedRectangle(radius: cornerRadius))
      } else {
        content.buttonBorderShape(.roundedRectangle)
      }
    } else {
      content.buttonBorderShape(.automatic)
    }
  case .circle:
    if #available(iOS 17.0, macOS 14.0, tvOS 16.4, *) {
      content.buttonBorderShape(.circle)
    } else {
      content.buttonBorderShape(.automatic)
    }
  }
}
