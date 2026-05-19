// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct OnScrollGeometryChangeModifier: ViewModifier, Record {
  // Set when the consumer passes a worklet callback. The modifier invokes the worklet
  // synchronously on the UI runtime for per-frame work that must not pay JS-thread dispatch cost.
  @Field var workletCallback: WorkletCallback?
  // Async event path used when no worklet is provided. Fires on the JS thread via the global modifier event dispatcher.
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    if #available(iOS 18.0, tvOS 18.0, *) {
      content
        .onScrollGeometryChange(for: ScrollGeometryPayload.self) { ScrollGeometryPayload($0) }
        action: { [workletCallback, eventDispatcher] _, payload in
          let geometry = payload.dictionary
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

internal struct OnScrollPhaseChangeModifier: ViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    if #available(iOS 18.0, tvOS 18.0, *) {
      content.onScrollPhaseChange { [eventDispatcher] _, newPhase, context in
        eventDispatcher?([
          "onScrollPhaseChange": [
            "phase": Self.phaseString(newPhase),
            "geometry": ScrollGeometryPayload(context.geometry).dictionary
          ]
        ])
      }
    } else {
      content
    }
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private static func phaseString(_ phase: ScrollPhase) -> String {
    return switch phase {
    case .idle: "idle"
    case .tracking: "tracking"
    case .interacting: "interacting"
    case .animating: "animating"
    case .decelerating: "decelerating"
    @unknown default: "idle"
    }
  }
}

// Equatable transform of `ScrollGeometry`. Shared between the two modifiers above.
internal struct ScrollGeometryPayload: Equatable {
  let contentOffsetX: CGFloat
  let contentOffsetY: CGFloat
  let containerWidth: CGFloat
  let containerHeight: CGFloat
  let contentWidth: CGFloat
  let contentHeight: CGFloat

  var dictionary: [String: Any] {
    [
      "contentOffsetX": contentOffsetX,
      "contentOffsetY": contentOffsetY,
      "containerWidth": containerWidth,
      "containerHeight": containerHeight,
      "contentWidth": contentWidth,
      "contentHeight": contentHeight
    ]
  }
}

@available(iOS 18.0, tvOS 18.0, *)
extension ScrollGeometryPayload {
  init(_ geometry: ScrollGeometry) {
    self.init(
      contentOffsetX: geometry.contentOffset.x,
      contentOffsetY: geometry.contentOffset.y,
      containerWidth: geometry.containerSize.width,
      containerHeight: geometry.containerSize.height,
      contentWidth: geometry.contentSize.width,
      contentHeight: geometry.contentSize.height
    )
  }
}
