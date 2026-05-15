// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

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
