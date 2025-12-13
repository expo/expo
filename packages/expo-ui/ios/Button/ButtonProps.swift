// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum ButtonRole: String, Enumerable {
  case `default`
  case destructive
  case cancel

  func toNativeRole() -> SwiftUI.ButtonRole? {
    switch self {
    case .default:
      return nil
    case .destructive:
      return SwiftUI.ButtonRole.destructive
    case .cancel:
      return SwiftUI.ButtonRole.cancel
    }
  }
}

final class ButtonProps: UIBaseViewProps, Observable {
  @Field var label: String?
  @Field var systemImage: String?
  @Field var role: ButtonRole?
  var onButtonPress = EventDispatcher()
}
