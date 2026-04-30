// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ScrollPositionModifier: ViewModifier, Record {
  @Field var id: ObservableState?
  @Field var anchor: UnitPointOptions?
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *), let id {
      ScrollPositionWrapper(
        state: id,
        anchor: anchor,
        eventDispatcher: eventDispatcher
      ) {
        content
      }
    } else {
      content
    }
  }
}

@available(iOS 17.0, tvOS 17.0, macOS 14.0, *)
private struct ScrollPositionWrapper<C: View>: View {
  @ObservedObject var state: ObservableState
  let anchor: UnitPointOptions?
  let eventDispatcher: EventDispatcher?
  @ViewBuilder let content: () -> C

  var body: some View {
    let activeID = Binding<String?>(
      get: { state.value as? String },
      set: { state.value = $0 }
    )
    content()
      .scrollPosition(id: activeID, anchor: anchor?.toUnitPoint)
      .onChange(of: state.value as? String) { _, newValue in
        let id: Any = newValue ?? NSNull()
        eventDispatcher?(["scrollPosition": ["id": id]])
      }
  }
}
