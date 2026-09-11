// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum MenuOrderType: String, Enumerable {
  case automatic
  case fixed
  case priority

  func toNativeMenuOrder() -> SwiftUI.MenuOrder {
    switch self {
    case .automatic:
      return .automatic
    case .fixed:
      return .fixed
    case .priority:
      // `.priority` is unavailable on tvOS; fall back to the platform default there.
      #if os(tvOS)
      return .automatic
      #else
      return .priority
      #endif
    }
  }
}

internal struct MenuOrderModifier: ViewModifier, Record {
  @Field var order: MenuOrderType = .automatic

  func body(content: Content) -> some View {
    content.menuOrder(order.toNativeMenuOrder())
  }
}
