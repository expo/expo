// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 Where an item sits in the toolbar, matching SwiftUI's `ToolbarItemPlacement`.
 */
internal enum ToolbarItemPlacementOptions: String, Enumerable {
  case automatic
  case principal
  case navigation
  case primaryAction
  case secondaryAction
  case status
  case confirmationAction
  case cancellationAction
  case destructiveAction
  case keyboard
  case topBarLeading
  case topBarTrailing
  case topBarPinnedTrailing
  case largeTitle
  case bottomBar

  func toPlacement() -> ToolbarItemPlacement {
    switch self {
    case .automatic:
      return .automatic
    case .principal:
      return .principal
    case .navigation:
      return .navigation
    case .primaryAction:
      return .primaryAction
    case .confirmationAction:
      return .confirmationAction
    case .cancellationAction:
      return .cancellationAction
    case .destructiveAction:
      return .destructiveAction

    case .secondaryAction:
#if os(tvOS)
      return .automatic
#else
      return .secondaryAction
#endif

    case .status:
#if os(tvOS)
      if #available(tvOS 18.0, *) {
        return .status
      }
      return .automatic
#else
      return .status
#endif

    case .keyboard:
#if os(iOS)
      return .keyboard
#else
      return .automatic
#endif

    case .topBarLeading:
#if os(macOS)
      return .automatic
#else
      return .topBarLeading
#endif

    case .topBarTrailing:
#if os(macOS)
      return .automatic
#else
      return .topBarTrailing
#endif

    case .topBarPinnedTrailing:
#if os(iOS) && compiler(>=6.4) // Xcode 27
      if #available(iOS 27.0, *) {
        return .topBarPinnedTrailing
      }
#endif
      return .automatic

    case .largeTitle:
#if os(iOS) && compiler(>=6.2) // Xcode 26
      if #available(iOS 26.0, *) {
        return .largeTitle
      }
#endif
      return .automatic

    case .bottomBar:
#if os(tvOS)
      if #available(tvOS 18.0, *) {
        return .bottomBar
      }
      return .automatic
#elseif os(macOS)
      return .automatic
#else
      return .bottomBar
#endif
    }
  }
}
