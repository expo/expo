// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject

/** Event names emitted by `NetworkRequestObserver`, matching the keys in the JS `NetworkRequestObserverEvents` type. */
internal const val REQUEST_STARTED_EVENT = "requestStarted"
internal const val REQUEST_COMPLETED_EVENT = "requestCompleted"

/**
 * JS-facing `SharedObject` that bridges per-instance JS subscriptions to the singleton
 * `NetworkRequestMonitor`. Each JS `new NetworkRequestObserver()` allocates one of these and
 * registers it as a delegate; the native instance is released when JS drops the reference, at
 * which point `sharedObjectDidRelease` removes the delegate registration.
 *
 * The class only forwards events — it doesn't store request history. Use
 * `NetworkRequestMonitor.shared.recent` for that.
 */
class NetworkRequestObserver(appContext: AppContext, filter: NetworkRequestFilter? = null) :
  SharedObject(appContext),
  NetworkRequestObserverDelegate {

  // The active filter, or null to observe every request. Guarded by `filterLock` so a read from
  // the monitor's fan-out (`shouldObserveRequest`) and a write from `setFilter` are atomic: a
  // `setFilter` call never leaves a request observed under a half-applied filter. `@Volatile` alone
  // would make each field read atomic, but the lock keeps the read and the swap a single
  // indivisible step.
  private val filterLock = Any()
  private var filter: NetworkRequestFilter? = filter

  init {
    NetworkRequestMonitor.shared.addDelegate(this)
  }

  override fun sharedObjectDidRelease() {
    NetworkRequestMonitor.shared.removeDelegate(this)
    super.sharedObjectDidRelease()
  }

  /**
   * Replaces the active filter. Pass null to observe every request. The swap is atomic.
   */
  fun setFilter(filter: NetworkRequestFilter?) = synchronized(filterLock) {
    this.filter = filter
  }

  override fun shouldObserveRequest(url: String, method: String): Boolean = synchronized(filterLock) {
    filter?.matches(url, method) ?: true
  }

  override fun onNetworkRequestStarted(request: NetworkRequestStarted) {
    emit(REQUEST_STARTED_EVENT, startedPayload(request))
  }

  override fun onNetworkRequestCompleted(request: NetworkRequest) {
    emit(REQUEST_COMPLETED_EVENT, completedPayload(request))
  }

  companion object {
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
