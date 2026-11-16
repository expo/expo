// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Event names emitted by `NetworkRequestObserver`, matching the keys in the JS
/// `NetworkRequestObserverEvents` type.
// swift-format-ignore: AlwaysUseLowerCamelCase
let REQUEST_STARTED_EVENT = "requestStarted"
// swift-format-ignore: AlwaysUseLowerCamelCase
let REQUEST_COMPLETED_EVENT = "requestCompleted"

/// Bridges one subscription to the singleton `NetworkRequestMonitor`: registers itself as a
/// delegate and passes each matching request to `onEvent` as an event name and payload.
///
/// The class only forwards events — it doesn't store request history. Use `NetworkRequestMonitor`'s
/// in-process API for that.
final class NetworkRequestObserver: NetworkRequestObserverDelegate, @unchecked Sendable {
  /// The active filter, or `nil` to observe every request. Held in a `Mutex` so the read from the
  /// monitor's fan-out (`shouldObserveRequest`) and the swap from `setFilter` are atomic: a
  /// `setFilter` call never leaves a request evaluated under a half-applied filter.
  private let filter: Mutex<NetworkRequestFilter?>

  private let onEvent: @Sendable (_ name: String, _ payload: sending [String: Any?]) -> Void

  init(
    filter: NetworkRequestFilter? = nil,
    onEvent: @escaping @Sendable (_ name: String, _ payload: sending [String: Any?]) -> Void
  ) {
    self.filter = Mutex(filter)
    self.onEvent = onEvent
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      NetworkRequestMonitor.shared.addDelegate(self)
    }
  }

  /// Replaces the active filter. Pass `nil` to observe every request. The swap is atomic: a request
  /// mid-fan-out is evaluated against either the old or the new filter, never a mix.
  func setFilter(_ filter: NetworkRequestFilter?) {
    self.filter.withLock { $0 = filter }
  }

  /// Deregisters from the monitor. The monitor holds delegates weakly, but deregister explicitly so
  /// the slot doesn't linger until the next fan-out prunes it.
  func stop() {
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      NetworkRequestMonitor.shared.removeDelegate(self)
    }
  }

  // MARK: - NetworkRequestObserverDelegate

  func onNetworkRequestStarted(_ request: NetworkRequestStarted) {
    onEvent(REQUEST_STARTED_EVENT, NetworkRequestObserver.startedPayload(for: request))
  }

  func onNetworkRequestCompleted(_ request: NetworkRequest) {
    onEvent(REQUEST_COMPLETED_EVENT, NetworkRequestObserver.completedPayload(for: request))
  }

  func shouldObserveRequest(url: URL, method: String) -> Bool {
    guard let filter = filter.withLock({ $0 }) else {
      return true
    }
    return filter.matches(url: url, method: method)
  }

  /// Internal so tests can assert the payload shape without a live JS runtime. The keys here are
  /// part of the public JS contract — additions are safe but renames are breaking.
  static func startedPayload(for request: NetworkRequestStarted) -> [String: Any?] {
    return [
      "id": request.id.uuidString,
      "url": request.url.absoluteString,
      "method": request.method,
      "startedAt": request.startedAt.ISO8601Format(),
    ]
  }

  static func completedPayload(for request: NetworkRequest) -> [String: Any?] {
    return [
      "id": request.id.uuidString,
      "url": request.url.absoluteString,
      "method": request.method,
      "statusCode": request.statusCode,
      "networkProtocol": request.networkProtocol,
      "requestBytesSent": request.requestBytesSent,
      "responseBytesReceived": request.responseBytesReceived,
      "errorDescription": request.errorDescription,
      "startedAt": request.timings.fetchStart?.ISO8601Format(),
      "completedAt": request.timings.responseEnd?.ISO8601Format(),
      "totalDuration": request.timings.totalDuration,
      "redirects": request.redirects.map { redirect -> [String: Any?] in
        return [
          "fromUrl": redirect.fromUrl.absoluteString,
          "toUrl": redirect.toUrl.absoluteString,
          "statusCode": redirect.statusCode,
          // Same ISO 8601 UTC shape as `startedAt`, with fractional seconds: hops within one
          // request are usually fractions of a second apart.
          "respondedAt": redirect.respondedAt?.ISO8601Format(.init(includingFractionalSeconds: true)),
        ]
      },
    ]
  }
}
