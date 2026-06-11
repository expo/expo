// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Receives notifications about HTTP requests observed by `NetworkRequestTaskSwizzling`. Both
 methods have default no-op implementations so delegates can opt into either start- or
 complete-time notifications without having to implement the other.
 */
public protocol NetworkRequestObserverDelegate: AnyObject, Sendable {
  func onNetworkRequestStarted(_ request: NetworkRequestStarted)
  func onNetworkRequestCompleted(_ request: NetworkRequest)

  /// Whether this delegate wants events for a request with the given URL and method. Consulted by
  /// the monitor before each fan-out call so a delegate's filter is evaluated before the payload is
  /// built. Only the URL and method are passed because those are the only attributes available at
  /// both start and completion, which keeps the started/completed decision consistent. The default
  /// implementation accepts every request.
  func shouldObserveRequest(url: URL, method: String) -> Bool
}

public extension NetworkRequestObserverDelegate {
  func onNetworkRequestStarted(_ request: NetworkRequestStarted) {}
  func onNetworkRequestCompleted(_ request: NetworkRequest) {}

  func shouldObserveRequest(url: URL, method: String) -> Bool {
    return true
  }
}

/**
 A singleton that aggregates `NetworkRequest` snapshots delivered by the URLSessionTask swizzles.

 The monitor is the central seam between the swizzle layer (which observes individual tasks
 complete) and whatever future layer routes those observations into telemetry. For now it keeps a
 small in-memory ring buffer of recent requests (useful for debug surfaces and tests) and fans
 each completion out to registered delegates.

 Started eagerly at app launch (see `AppMetricsAppDelegateSubscriber.appDelegateWillBeginInitialization`)
 so the swizzles run before React Native makes its first fetch.
 */
@AppMetricsActor
public final class NetworkRequestMonitor: Sendable {
  public static let shared = NetworkRequestMonitor()

  /** Maximum number of recent requests retained for debug surfaces. */
  private let recentCapacity = 200

  private var recentRequests: [NetworkRequest] = []
  private var delegates: [WeakDelegate] = []
  private var started = false

  /** Internal so tests can construct dedicated instances; production code uses `shared`. */
  init() {}

  /**
   Confirms the URLSessionTask swizzles are installed. The app-delegate subscriber already
   installs them synchronously at launch (before the first request); this re-asserts the install
   for any path that reaches the monitor without going through the subscriber. Idempotent —
   subsequent calls are no-ops.
   */
  func start() {
    if started {
      return
    }
    started = true
    NetworkRequestTaskSwizzling.install()
  }

  /**
   Most recently observed requests, oldest first. Bounded by `recentCapacity`. Intended for
   debug surfaces; not for the dispatch path.
   */
  public var recent: [NetworkRequest] {
    return recentRequests
  }

  /**
   Folds the requests whose `timings.fetchStart` falls within `[start, end]` into a summary.
   Used by the TTI metric to attach a per-launch network rollup. Bounded by the ring buffer:
   under heavy network load the earliest requests in the window may have been evicted, in
   which case the summary undercounts — acceptable for a TTI-attached signal.
   */
  func summarize(start: Date, end: Date) -> NetworkRequestSummary {
    let inWindow = recentRequests.filter { request in
      guard let fetchStart = request.timings.fetchStart else {
        return false
      }
      return fetchStart >= start && fetchStart <= end
    }
    return NetworkRequestSummary.from(inWindow)
  }

  /**
   Adds a delegate that will be notified for each completed request. Delegates are held weakly.
   */
  public func addDelegate(_ delegate: NetworkRequestObserverDelegate) {
    pruneDelegates()
    delegates.append(WeakDelegate(value: delegate))
  }

  public func removeDelegate(_ delegate: NetworkRequestObserverDelegate) {
    delegates.removeAll { $0.value === delegate || $0.value == nil }
  }

  /**
   Records a completed request: appends to the ring buffer and fans it out to delegates. Called
   from `NetworkRequestTaskSwizzling.recordCompletion` (which fires from either the delegate proxy's
   metrics callback or the `setState:` fallback) on the `AppMetricsActor`.
   */
  func record(_ request: NetworkRequest) {
    recentRequests.append(request)
    if recentRequests.count > recentCapacity {
      recentRequests.removeFirst(recentRequests.count - recentCapacity)
    }
    pruneDelegates()
    for entry in delegates {
      guard let delegate = entry.value else {
        continue
      }
      if delegate.shouldObserveRequest(url: request.url, method: request.method) {
        delegate.onNetworkRequestCompleted(request)
      }
    }
  }

  /**
   Records that a request has begun. No ring-buffer entry — the started snapshot is purely a
   notification used to surface in-flight state to subscribers. The corresponding completion
   event will arrive later with a matching `id`.
   */
  func recordStart(_ request: NetworkRequestStarted) {
    pruneDelegates()
    for entry in delegates {
      guard let delegate = entry.value else {
        continue
      }
      if delegate.shouldObserveRequest(url: request.url, method: request.method) {
        delegate.onNetworkRequestStarted(request)
      }
    }
  }

  private func pruneDelegates() {
    delegates.removeAll { $0.value == nil }
  }

  private struct WeakDelegate {
    weak var value: NetworkRequestObserverDelegate?
  }
}
