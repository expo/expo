// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ControlSizeType: String, Enumerable {
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

internal struct ControlSizeModifier: ViewModifier, Record {
  @Field var size: ControlSizeType = .regular

  func body(content: Content) -> some View {
    content.controlSize(size.toNativeControlSize())
  }
}