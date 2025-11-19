// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum MenuActionDismissBehaviorType: String, Enumerable {
  case automatic
  case disabled
  case enabled
}

internal struct MenuActionDismissBehaviorModifier: ViewModifier, Record {
  @Field var behavior: MenuActionDismissBehaviorType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 16.4, tvOS 16.4, *) {
      if let behavior {
        switch behavior {
        case .disabled:
          content.menuActionDismissBehavior(.disabled)
        case .enabled:
          content.menuActionDismissBehavior(.enabled)
        case .automatic:
          content.menuActionDismissBehavior(.automatic)
        }
      } else {
        content
      }
    } else {
      content
    }
  }
}