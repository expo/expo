// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal typealias ModifierType = [String: Any]
internal typealias ModifierArray = [ModifierType]

internal extension View {
  /**
   * Applies an array of modifiers to a view using the ViewModifierRegistry.
   */
  @ViewBuilder
  func applyModifiers(_ modifiers: ModifierArray?, appContext: AppContext?, globalEventDispatcher: EventDispatcher) -> some View {
    if let modifiers, let appContext {
      modifiers.reduce(AnyView(self)) { currentView, modifierConfig in
        guard let type = modifierConfig["$type"] as? String else {
          return currentView
        }

        return ViewModifierRegistry.shared.applyModifier(
          type,
          to: currentView,
          appContext: appContext,
          globalEventDispatcher: globalEventDispatcher,
          params: modifierConfig
        )
      }
    } else {
      self
    }
  }
}
