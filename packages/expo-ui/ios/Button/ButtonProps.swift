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

internal enum ButtonVariant: String, Enumerable {
  case `default`
  case bordered
  case accessoryBar
  case accessoryBarAction
  case borderedProminent
  case borderless
  case card
  case link
  case plain
}

class ButtonProps: ExpoSwiftUI.ViewProps, Observable {
  required init() {}
  @Field var text: String = ""
  @Field var systemImage: String?
  @Field var buttonRole: ButtonRole? = .default
  @Field var variant: ButtonVariant? = .default
  var onButtonPressed = EventDispatcher()
  var internalOnPress: (() -> Void)?
}
