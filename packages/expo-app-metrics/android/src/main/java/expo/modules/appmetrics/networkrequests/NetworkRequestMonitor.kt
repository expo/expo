// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import java.lang.ref.WeakReference
import java.util.Date

/**
 * Receives notifications about HTTP requests observed by `NetworkRequestInterceptor`. Both
 * methods default to no-ops so delegates can opt into either start- or complete-time
 * notifications without implementing the other.
 */
interface NetworkRequestObserverDelegate {
  fun onNetworkRequestStarted(request: NetworkRequestStarted) {}
  fun onNetworkRequestCompleted(request: NetworkRequest) {}
}

/**
 * Aggregates `NetworkRequest` snapshots delivered by the OkHttp interceptor and fans them out to
 * registered delegates. Mirrors the iOS `NetworkRequestMonitor`.
 *
 * The interceptor runs on OkHttp's dispatcher threads; delegates may be added/removed from any
 * thread (JS-facing observers come from the React thread, the singleton is reachable from app
 * code). All shared state is guarded by a single intrinsic lock - the work inside is small and
 * synchronous, so contention is negligible.
 */
class NetworkRequestMonitor internal constructor() {
  /** Maximum number of completed requests retained for debug surfaces. */
  private val recentCapacity = 200

  private val lock = Any()
  private val recentRequests = ArrayDeque<NetworkRequest>()
  private val delegates = mutableListOf<WeakReference<NetworkRequestObserverDelegate>>()

  /**
   * Most recently observed completed requests, oldest first. Bounded by `recentCapacity`.
   * Intended for debug surfaces and the TTI summary; not for the dispatch path.
   */
  val recent: List<NetworkRequest>
    get() = synchronized(lock) { recentRequests.toList() }

  /**
   * Folds the requests whose `timings.fetchStart` falls within `[start, end]` into a summary.
   * Used by the TTI metric to attach a per-launch network rollup. Bounded by the ring buffer:
   * under heavy network load the earliest requests in the window may have been evicted, in which
   * case the summary undercounts - acceptable for a TTI-attached signal.
   */
  fun summarize(start: Date, end: Date): NetworkRequestSummary {
    val inWindow = synchronized(lock) {
      recentRequests.filter { request ->
        val fetchStart = request.timings.fetchStart ?: return@filter false
        !fetchStart.before(start) && !fetchStart.after(end)
      }
    }
    return NetworkRequestSummary.from(inWindow)
  }

  /** Adds a delegate. Held weakly - drop the reference to unsubscribe. */
  fun addDelegate(delegate: NetworkRequestObserverDelegate) = synchronized(lock) {
    delegates.removeAll { it.get() == null }
    delegates.add(WeakReference(delegate))
  }

  fun removeDelegate(delegate: NetworkRequestObserverDelegate) = synchronized(lock) {
    delegates.removeAll {
      val strongRef = it.get()
      strongRef === delegate || strongRef == null
    }
  }

  /** Records a completed request: appends to the ring buffer and fans out. */
  fun record(request: NetworkRequest) {
    val snapshot = synchronized(lock) {
      recentRequests.addLast(request)
      while (recentRequests.size > recentCapacity) {
        recentRequests.removeFirst()
      }
      delegates.removeAll { it.get() == null }
      delegates.mapNotNull { it.get() }
    }
    for (delegate in snapshot) {
      delegate.onNetworkRequestCompleted(request)
    }
  }

  /**
   * Records that a request has begun. No ring-buffer entry - the started snapshot is purely a
   * notification used to surface in-flight state to subscribers. The corresponding completion
   * event will arrive later with a matching `id`.
   */
  fun recordStart(request: NetworkRequestStarted) {
    val snapshot = synchronized(lock) {
      delegates.removeAll { it.get() == null }
      delegates.mapNotNull { it.get() }
    }
    for (delegate in snapshot) {
      delegate.onNetworkRequestStarted(request)
    }
  }

  companion object {
    /** Process-wide singleton mirroring `NetworkRequestMonitor.shared` on iOS. */
    val shared: NetworkRequestMonitor = NetworkRequestMonitor()
  }
}
