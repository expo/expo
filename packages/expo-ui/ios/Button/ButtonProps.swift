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

internal enum ButtonControlSize: String, Enumerable {
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
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .extraLarge
      } else {
        return .large
      }
    @unknown default:
      return .regular
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
  case glass
  case glassProminent
}

final class ButtonProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps, Observable {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var text: String?
  @Field var systemImage: String?
  @Field var color: Color?
  @Field var buttonRole: ButtonRole? = .default
  @Field var controlSize: ButtonControlSize? = .regular
  @Field var variant: ButtonVariant? = .default
  @Field var disabled: Bool = false
  var onButtonPressed = EventDispatcher()
}

