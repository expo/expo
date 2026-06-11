// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/** Event names emitted by `NetworkRequestObserver`, matching the keys in the JS
 `NetworkRequestObserverEvents` type. */
let REQUEST_STARTED_EVENT = "requestStarted"
let REQUEST_COMPLETED_EVENT = "requestCompleted"

/**
 JS-facing `SharedObject` that bridges per-instance subscriptions to the singleton
 `NetworkRequestMonitor`. Each JS `new NetworkRequestObserver()` allocates one of these and
 registers it as a delegate; the native instance is released when JS drops the reference, at
 which point `sharedObjectWillRelease` removes the delegate registration.

 The class only forwards events — it doesn't store request history. Use `NetworkRequestMonitor`'s
 in-process API for that.
 */
public final class NetworkRequestObserver: SharedObject, NetworkRequestObserverDelegate, @unchecked Sendable {
  public override init() {
    super.init()
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      NetworkRequestMonitor.shared.addDelegate(self)
    }
  }

  public override func sharedObjectWillRelease() {
    // The monitor holds delegates weakly, but deregister explicitly so the slot doesn't linger
    // until the next fan-out prunes it — matches the Android `sharedObjectDidRelease` cleanup.
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      NetworkRequestMonitor.shared.removeDelegate(self)
    }
    super.sharedObjectWillRelease()
  }

  // MARK: - NetworkRequestObserverDelegate

  public func onNetworkRequestStarted(_ request: NetworkRequestStarted) {
    emit(event: REQUEST_STARTED_EVENT, payload: NetworkRequestObserver.startedPayload(for: request))
  }

  public func onNetworkRequestCompleted(_ request: NetworkRequest) {
    emit(event: REQUEST_COMPLETED_EVENT, payload: NetworkRequestObserver.completedPayload(for: request))
  }

  /** Internal so tests can assert the payload shape without going through `emit`, which needs a
   live JS runtime. The keys here are part of the public JS contract — additions are safe but
   renames are breaking. */
  static func startedPayload(for request: NetworkRequestStarted) -> [String: Any?] {
    return [
      "id": request.id.uuidString,
      "url": request.url.absoluteString,
      "method": request.method,
      "startedAt": request.startedAt.ISO8601Format()
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
      "redirects": request.redirects.map {
        return [
          "fromUrl": $0.fromUrl.absoluteString,
          "toUrl": $0.toUrl.absoluteString,
          "statusCode": $0.statusCode
        ]
      }
    ]
  }
}
