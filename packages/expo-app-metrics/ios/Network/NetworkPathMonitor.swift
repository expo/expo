// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A singleton that owns the long-lived `NetworkPathObserver` and caches the
 most recent `NetworkPath` snapshot.

 The observer is started eagerly at app launch (see
 `AppMetricsAppDelegateSubscriber.appDelegateWillBeginInitialization`) so the
 cache is warm by the time `markInteractive` reads it. `NWPathMonitor` is
 event-driven and cheap, so there's no benefit to deferring the start.

 Readers can either grab the cached `currentPath` synchronously, or `await
 waitForFirstPath()` if they specifically need the first OS-delivered path
 (and don't mind suspending for it). The latter is what TTI param collection
 uses — the TTI value itself is captured from the synchronously-recorded
 `markers.timeToInteractive` timestamp, so awaiting the first path here only
 delays the local-storage write, not the metric measurement.
 */
@AppMetricsActor
final class NetworkPathMonitor: NetworkPathObserverDelegate, Sendable {
  static let shared = NetworkPathMonitor()

  private var observer: NetworkPathObserver?
  private(set) var currentPath: NetworkPath?

  /**
   All resumed at once when the first path is delivered. An array (rather
   than a single optional) means concurrent callers don't clobber each
   other's continuations — useful if a future metric joins the TTI metric in
   awaiting the first path.
   */
  private var firstPathContinuations: [CheckedContinuation<Void, Never>] = []

  /** Internal so tests can construct dedicated instances; production code uses `shared`. */
  init() {}

  /**
   Idempotent. Constructs the observer on the first call; later calls are
   no-ops. The observer runs for the app lifetime.
   */
  func start() {
    if observer != nil {
      return
    }
    observer = NetworkPathObserver(delegate: self)
  }

  /**
   Suspends until the first path delivery, then returns the latest cached
   path. Returns immediately if a path has already been received.
   */
  func waitForFirstPath() async -> NetworkPath? {
    if currentPath != nil {
      return currentPath
    }
    await withCheckedContinuation { firstPathContinuations.append($0) }
    return currentPath
  }

  /**
   Caches `path` and resumes any callers awaiting the first path. Tests on
   `AppMetricsActor` can call this directly to avoid the async hop in
   `onNetworkPathUpdate(_:)`.
   */
  func apply(_ path: NetworkPath) {
    let wasFirst = currentPath == nil
    currentPath = path
    if wasFirst {
      let pending = firstPathContinuations
      firstPathContinuations.removeAll()
      for continuation in pending {
        continuation.resume()
      }
    }
  }

  // MARK: - NetworkPathObserverDelegate

  nonisolated func onNetworkPathUpdate(_ path: NetworkPath) {
    AppMetricsActor.isolated { [self] in
      apply(path)
    }
  }
}
