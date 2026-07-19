// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct OnGeometryChangeModifier: ViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

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
