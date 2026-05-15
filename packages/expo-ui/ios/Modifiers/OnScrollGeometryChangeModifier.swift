// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct OnScrollGeometryChangeModifier: ViewModifier, Record {
  /// Set when the consumer passes a worklet callback. The modifier invokes
  /// the worklet synchronously on the UI runtime for per-frame work that must
  /// not pay JS-thread dispatch cost.
  @Field var workletCallback: WorkletCallback?
  /// Async event path used when no worklet is provided. Fires on the JS
  /// thread via the global modifier event dispatcher.
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    if #available(iOS 18.0, tvOS 18.0, *) {
      content
        .onScrollGeometryChange(for: ScrollGeometryPayload.self) { geometry in
          ScrollGeometryPayload(
            contentOffsetX: geometry.contentOffset.x,
            contentOffsetY: geometry.contentOffset.y,
            containerWidth: geometry.containerSize.width,
            containerHeight: geometry.containerSize.height,
            contentWidth: geometry.contentSize.width,
            contentHeight: geometry.contentSize.height
          )
        } action: { [workletCallback, eventDispatcher] _, payload in
          let geometry: [String: Any] = [
            "contentOffsetX": payload.contentOffsetX,
            "contentOffsetY": payload.contentOffsetY,
            "containerWidth": payload.containerWidth,
            "containerHeight": payload.containerHeight,
            "contentWidth": payload.contentWidth,
            "contentHeight": payload.contentHeight
          ]
          // Mutually exclusive: the JS factory wires one path at a time.
          // Skipping the regular dispatcher when a worklet is attached
          // avoids the per-frame dictionary allocation + async JS event.
          if let workletCallback {
            workletCallback.invoke(arguments: [geometry])
          } else {
            eventDispatcher?(["onScrollGeometryChange": geometry])
          }
        }
    } else {
      content
    }
  }
}

/// Equatable transform of `ScrollGeometry` so `.onScrollGeometryChange` only
/// fires when an observed dimension actually changes.
private struct ScrollGeometryPayload: Equatable {
  let contentOffsetX: CGFloat
  let contentOffsetY: CGFloat
  let containerWidth: CGFloat
  let containerHeight: CGFloat
  let contentWidth: CGFloat
  let contentHeight: CGFloat
}
