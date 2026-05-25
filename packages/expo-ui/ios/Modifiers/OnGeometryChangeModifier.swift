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

  private func dispatch(_ size: CGSize) {
    eventDispatcher?(["onGeometryChange": [
      "width": size.width,
      "height": size.height
    ]])
  }

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      content.onGeometryChange(for: CGSize.self, of: { proxy in proxy.size }, action: {
        dispatch($0)
      })
    } else {
      content.background(
        GeometryReader { geometry in
          Color.clear
            .onAppear { dispatch(geometry.size) }
            .onChange(of: geometry.size) { dispatch($0) }
        }
      )
    }
  }
}
