// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public enum ButtonRole: String, Enumerable {
  case `default`
  case destructive
  case cancel
  case close

  public func toNativeRole() -> SwiftUI.ButtonRole? {
    switch self {
    case .default:
      return nil
    case .destructive:
      return SwiftUI.ButtonRole.destructive
    case .cancel:
      return SwiftUI.ButtonRole.cancel
    case .close:
      if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
        return SwiftUI.ButtonRole.close
      }
      return nil
    }
  }
}

open class ButtonProps: UIBaseViewProps, Observable {
  @Field public var label: String?
  @Field public var systemImage: String?
  @Field public var role: ButtonRole?
  var onButtonPress = EventDispatcher()
}
