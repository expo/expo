// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct OnHingeChangeModifier: ViewModifier, Record {
  // Worklet path: synchronous invocation on the UI runtime (no JS-thread dispatch).
  @Field var workletCallback: WorkletCallback?
  // JS-thread path: async event via the global modifier event dispatcher.
  var eventDispatcher: EventDispatcher?
  private var delivery = HingeDeliveryState()

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
#if canImport(SwiftUI, _version: 8.0.85) // iOS 27.1 SDK
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      content.onHingeChange { [workletCallback, eventDispatcher, delivery] oldContext, newContext in
        // SwiftUI repeats the action with equal contexts while a fold relayouts the hierarchy. The
        // first call carries the initial state and passes even when neither context has a hinge.
        guard !delivery.hasDelivered || oldContext != newContext else {
          return
        }
        delivery.hasDelivered = true
        let old = HingeContextPayload(oldContext).dictionary
        let new = HingeContextPayload(newContext).dictionary
        if let workletCallback {
          workletCallback.invoke(arguments: [old, new])
        } else {
          eventDispatcher?(["onHingeChange": ["oldContext": old, "newContext": new]])
        }
      }
    } else {
      content
    }
#else
    content
#endif
  }
}

/// Whether the modifier has forwarded its first call, which no later equal-context call repeats.
private final class HingeDeliveryState {
  var hasDelivered = false
}

/// The hinge context as sent to JS: `hinge` is `null` when the device has no hinge or the view
/// hierarchy provides no hinge updates. The angle is in degrees.
internal struct HingeContextPayload {
  let angle: Double?
  let status: String?

  var dictionary: [String: Any] {
    guard let angle, let status else {
      return ["hinge": NSNull()]
    }
    return ["hinge": ["angle": angle, "status": status]]
  }
}

#if canImport(SwiftUI, _version: 8.0.85) // iOS 27.1 SDK
@available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *)
extension HingeContextPayload {
  init(_ context: DeviceHingeContext) {
    self.init(angle: context.hinge?.angle.degrees, status: context.hinge.map { Self.statusString($0.status) })
  }

  private static func statusString(_ status: DeviceHinge.Status) -> String {
    return switch status {
    case .closed: "closed"
    case .partiallyOpen: "partiallyOpen"
    case .fullyOpen: "fullyOpen"
    default: "unknown"
    }
  }
}
#endif
