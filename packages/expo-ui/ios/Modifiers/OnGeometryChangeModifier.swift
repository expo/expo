// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct OnGeometryChangeModifier: EventDispatchingViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  private func dispatch(_ frame: CGRect) {
    eventDispatcher?(["onGeometryChange": [
      "x": frame.origin.x,
      "y": frame.origin.y,
      "width": frame.size.width,
      "height": frame.size.height
    ]])
  }

  func body(content: Content) -> some View {
    content.onGeometryChange(for: CGRect.self, of: { proxy in proxy.frame(in: .global) }, action: {
      dispatch($0)
    })
  }
}
