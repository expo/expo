// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ControlSizeType: String, UIEnum {
  case mini
  case small
  case regular
  case large
  case extraLarge

  func toNativeControlSize() -> SwiftUI.ControlSize {
    switch self {
    case .mini:
      return .mini
    case .small:
      return .small
    case .regular:
      return .regular
    case .large:
      return .large
    case .extraLarge:
      if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
        return .extraLarge
      } else {
        return .large
      }
    }
  }
}

@MainActor @AnyViewBuilder
internal func controlSizeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let size: ControlSizeType = try p.value("size", .regular)
  content.controlSize(size.toNativeControlSize())
}
