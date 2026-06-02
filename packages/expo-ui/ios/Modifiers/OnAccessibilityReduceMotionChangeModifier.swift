// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// `accessibilityReduceMotion` is a get-only `EnvironmentValues` key, so it can be read but
// not written through `.environment(_:_:)` (which requires a `WritableKeyPath`). This modifier
// therefore exposes a read path: it reports the current value on appear and on every change,
// mirroring `OnGeometryChangeModifier`'s dispatch pattern.
internal struct OnAccessibilityReduceMotionChangeModifier: ViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    content.background(
      ReduceMotionReader { isEnabled in
        eventDispatcher?(["onAccessibilityReduceMotionChange": ["isReduceMotionEnabled": isEnabled]])
      }
    )
  }
}

// `@Environment` is read in a dedicated child view so SwiftUI injects and tracks it, keeping
// the value-type modifier free of view-tree state.
private struct ReduceMotionReader: View {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  let onValue: (Bool) -> Void

  init(onValue: @escaping (Bool) -> Void) {
    self.onValue = onValue
  }

  var body: some View {
    Color.clear
      .onAppear { onValue(reduceMotion) }
      .onChange(of: reduceMotion) { onValue($0) }
  }
}
