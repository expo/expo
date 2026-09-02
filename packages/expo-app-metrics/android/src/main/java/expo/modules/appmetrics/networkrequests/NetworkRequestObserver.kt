// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/** Event names emitted by `NetworkRequestObserver`, matching the keys in the JS `NetworkRequestObserverEvents` type. */
internal const val REQUEST_STARTED_EVENT = "requestStarted"
internal const val REQUEST_COMPLETED_EVENT = "requestCompleted"

/**
 * JS-facing `SharedObject` that bridges per-instance JS subscriptions to the singleton
 * `NetworkRequestMonitor`. Each JS `new NetworkRequestObserver()` allocates one of these. It is
 * registered as a delegate while it has event listeners and is unregistered after its last
 * listener is removed or the shared object is released.
 *
 * The class only forwards events — it doesn't store request history. Use
 * `NetworkRequestMonitor.shared.recent` for that.
 */
class NetworkRequestObserver private constructor(
  appContext: AppContext,
  filter: NetworkRequestFilter?,
  private val monitor: NetworkRequestMonitor // Set for testing, otherwise default singleton
) :
  SharedObject(appContext),
  NetworkRequestObserverDelegate {

  constructor(appContext: AppContext, filter: NetworkRequestFilter? = null) :
    this(appContext, filter, NetworkRequestMonitor.shared)

  // The active filter, or null to observe every request. An `AtomicReference` so the read from the
  // monitor's fan-out (`shouldObserveRequest`) and the swap from `setFilter` are atomic: a
  // `setFilter` call never leaves a request observed under a half-applied filter.
  private val filter = AtomicReference(filter)
  private val observing = AtomicBoolean(false)
  private val listenerLock = Any()
  private val listenedEvents = mutableSetOf<String>()

  override fun onStartListeningToEvent(eventName: String) {
    if (eventName != REQUEST_STARTED_EVENT && eventName != REQUEST_COMPLETED_EVENT) {
      return
    }
    synchronized(listenerLock) {
      listenedEvents.add(eventName)
      if (observing.compareAndSet(false, true)) {
        monitor.addDelegate(this)
      }
    }
  }

  override fun onStopListeningToEvent(eventName: String) {
    synchronized(listenerLock) {
      listenedEvents.remove(eventName)
      if (listenedEvents.isEmpty() && observing.compareAndSet(true, false)) {
        monitor.removeDelegate(this)
      }
    }
  }

  override fun sharedObjectDidRelease() {
    synchronized(listenerLock) {
      listenedEvents.clear()
      observing.set(false)
      monitor.removeDelegate(this)
    }
    super.sharedObjectDidRelease()
  }

  /**
   * Replaces the active filter. Pass null to observe every request. The swap is atomic.
   */
  fun setFilter(filter: NetworkRequestFilter?) {
    this.filter.set(filter)
  }

  override fun shouldObserveRequest(url: String, method: String): Boolean {
    return observing.get() && (filter.get()?.matches(url, method) ?: true)
  }

  override fun onNetworkRequestStarted(request: NetworkRequestStarted) {
    if (isListeningTo(REQUEST_STARTED_EVENT)) {
      emit(REQUEST_STARTED_EVENT, startedPayload(request))
    }
  }

  override fun onNetworkRequestCompleted(request: NetworkRequest) {
    if (isListeningTo(REQUEST_COMPLETED_EVENT)) {
      emit(REQUEST_COMPLETED_EVENT, completedPayload(request))
    }
  }

  private fun isListeningTo(eventName: String): Boolean = synchronized(listenerLock) {
    observing.get() && listenedEvents.contains(eventName)
  }

  companion object {
    internal fun forTesting(
      appContext: AppContext,
      monitor: NetworkRequestMonitor,
      filter: NetworkRequestFilter? = null
    ) = NetworkRequestObserver(appContext, filter, monitor)

    /**
     * Internal so tests can assert the payload shape without going through `emit`, which needs a
     * live JS runtime. The keys here are part of the public JS contract — additions are safe but
     * renames are breaking.
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
          "statusCode" to redirect.statusCode
        )
      }
    )
  }
}
