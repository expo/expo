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

internal extension Text {
  func applyTextModifiers(_ modifiers: ModifierArray?, appContext: AppContext?) -> Text {
    guard let modifiers, let appContext else { return self }

    return modifiers.reduce(self) { currentText, modifierConfig in
      guard let type = modifierConfig["$type"] as? String else {
        return currentText
      }

      return ViewModifierRegistry.shared.applyTextModifier(
        type,
        to: currentText,
        appContext: appContext,
        params: modifierConfig
      )
    }
  }
}

internal extension Image {
  @ViewBuilder
  func applyImageModifiers(_ modifiers: ModifierArray?, appContext: AppContext?) -> some View {
    if let modifiers, let appContext {
      let image = modifiers.reduce(self) { currentImage, modifierConfig in
        guard let type = modifierConfig["$type"] as? String else {
          return currentImage
        }
        return ViewModifierRegistry.shared.applyImageModifier(
          type,
          to: currentImage,
          appContext: appContext,
          params: modifierConfig
        )
      }

      if #available(iOS 18.0, *),
         let modifierConfig = modifiers.first(where: { $0["$type"] as? String == "widgetAccentedRenderingMode" }),
         let modifier = try? WidgetAccentedRenderingModeModifier(from: modifierConfig, appContext: appContext) {
        modifier.apply(to: image)
      } else {
        image
      }
    } else {
      self
    }
  }
}
