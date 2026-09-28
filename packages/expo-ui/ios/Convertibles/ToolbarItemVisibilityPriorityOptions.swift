// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 How readily a toolbar item gives up its place, matching SwiftUI's `ToolbarItemVisibilityPriority`.
 */
internal enum ToolbarItemVisibilityPriorityOptions: String, Enumerable {
  case automatic
  case low
  case high

#if compiler(>=6.4) // Xcode 27
  @available(iOS 27.0, macOS 26.1, tvOS 27.0, visionOS 27.0, *)
  func toPriority() -> ToolbarItemVisibilityPriority {
    switch self {
    case .automatic:
      return .automatic
    case .low:
#if os(iOS) || os(macOS)
      return .low
#else
      return .automatic
#endif
    case .high:
#if os(iOS) || os(macOS)
      return .high
#else
      return .automatic
#endif
    }
  }
#endif
}
