// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.observe.shared.networkrequests

import expo.modules.observe.shared.utils.TimeUtils
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/** Event names emitted by `NetworkRequestObserver`, matching the keys in the JS `NetworkRequestObserverEvents` type. */
internal const val REQUEST_STARTED_EVENT = "requestStarted"
internal const val REQUEST_COMPLETED_EVENT = "requestCompleted"

/**
 * Bridges one subscriber to the singleton `NetworkRequestMonitor` and reports each matching
 * request to `onEvent`. It registers as a delegate right away; `stop` drops the registration.
 * Each JS `new NetworkRequestObserver()` allocates one of these, whether or not JS has attached
 * listeners yet, and stops it when the JS object is released. This matches the iOS observer.
 *
 * Because registration doesn't track JS listeners, an observer whose listeners were all removed
 * still pays one `emit` per matching request until JS releases it. Gating on listener count would
 * need `onStartListeningToEvent`/`onStopListeningToEvent`, and the runtime only wires those up for
 * classes that declare `Events(...)` in their module definition, which this one deliberately
 * doesn't.
 *
 * The class only forwards events — it doesn't store request history. Use
 * `NetworkRequestMonitor.shared.recent` for that.
 */
internal class NetworkRequestObserver private constructor(
  filter: NetworkRequestFilter?,
  private val monitor: NetworkRequestMonitor, // Set for testing, otherwise default singleton
  private val onEvent: (String, Map<String, Any?>) -> Unit
) : NetworkRequestObserverDelegate {

  constructor(filter: NetworkRequestFilter? = null, onEvent: (String, Map<String, Any?>) -> Unit) :
    this(filter, NetworkRequestMonitor.shared, onEvent)

  // The active filter, or null to observe every request. An `AtomicReference` so the read from the
  // monitor's fan-out (`shouldObserveRequest`) and the swap from `setFilter` are atomic: a
  // `setFilter` call never leaves a request observed under a half-applied filter.
  private val filter = AtomicReference(filter)

  // Flipped once on `stop`. The monitor holds delegates weakly and prunes them on the next
  // fan-out, so a request evaluated in that window must still be rejected here.
  private val released = AtomicBoolean(false)

  init {
    monitor.addDelegate(this)
  }

  /** Stops reporting requests. */
  fun stop() {
    released.set(true)
    monitor.removeDelegate(this)
  }

  /**
   * Replaces the active filter. Pass null to observe every request. The swap is atomic.
   */
  fun setFilter(filter: NetworkRequestFilter?) {
    this.filter.set(filter)
  }

  override fun shouldObserveRequest(url: String, method: String): Boolean {
    return !released.get() && (filter.get()?.matches(url, method) ?: true)
  }

  override fun onNetworkRequestStarted(request: NetworkRequestStarted) {
    onEvent(REQUEST_STARTED_EVENT, startedPayload(request))
  }

  override fun onNetworkRequestCompleted(request: NetworkRequest) {
    onEvent(REQUEST_COMPLETED_EVENT, completedPayload(request))
  }

  companion object {
    internal fun forTesting(
      monitor: NetworkRequestMonitor,
      filter: NetworkRequestFilter? = null
    ) = NetworkRequestObserver(filter, monitor) { _, _ -> }

    /**
     * Internal so tests can assert the payload shape without going through `onEvent`. The keys
     * here are part of the public JS contract — additions are safe but renames are breaking.
     */
    internal fun startedPayload(request: NetworkRequestStarted): Map<String, Any?> = mapOf(
      "id" to request.id.toString(),
      "url" to request.url,
      "method" to request.method,
      "startedAt" to TimeUtils.dateToIsoUtcSeconds(request.startedAt)
    )

    internal fun completedPayload(request: NetworkRequest): Map<String, Any?> = mapOf(
      "id" to request.id.toString(),
      "url" to request.url,
      "method" to request.method,
      "statusCode" to request.statusCode,
      "networkProtocol" to request.networkProtocol,
      "requestBytesSent" to request.requestBytesSent,
      "responseBytesReceived" to request.responseBytesReceived,
      "errorDescription" to request.errorDescription,
      "startedAt" to request.timings.fetchStart?.let { TimeUtils.dateToIsoUtcSeconds(it) },
      "completedAt" to request.timings.responseEnd?.let { TimeUtils.dateToIsoUtcSeconds(it) },
      "totalDuration" to request.timings.totalDuration,
      "redirects" to request.redirects.map { redirect ->
        mapOf(
          "fromUrl" to redirect.fromUrl,
          "toUrl" to redirect.toUrl,
          "statusCode" to redirect.statusCode,
          // Same ISO 8601 UTC shape as `startedAt`, with fractional seconds: hops within one
          // request are usually fractions of a second apart.
          "respondedAt" to redirect.respondedAtMs?.let { TimeUtils.millisToTimestamp(it) }
        )
      }
    )
  }
}
