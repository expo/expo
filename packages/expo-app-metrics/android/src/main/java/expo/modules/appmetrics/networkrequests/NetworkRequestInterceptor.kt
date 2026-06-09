// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import okhttp3.Call
import okhttp3.EventListener
import okhttp3.Handshake
import okhttp3.Headers
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.buffer
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Proxy
import java.util.Date
import java.util.UUID
import java.util.WeakHashMap

/**
 * Sentinel header recognised by `NetworkRequestInterceptor` to skip observation. expo-observe's
 * dispatcher sets it on outgoing telemetry so our own uploads don't recurse through the monitor.
 * Mirrors `NetworkRequestTaskSwizzling.internalHeaderName` on iOS — keep the literal in sync.
 */
const val INTERNAL_HEADER_NAME = "Expo-AppMetrics-Skip"

/**
 * Marker tag attached to requests that have already entered our application interceptor. Used by
 * the double-instrumentation guard: if an app installs `NetworkRequestInterceptor.instance` on a
 * client that's *also* getting injected by the RN factory hook, the second pass short-circuits
 * to `chain.proceed(request)` without re-observing.
 */
private object AlreadyObservedMarker

/**
 * OkHttp `Interceptor` that records every HTTP request that traverses an `OkHttpClient` it's
 * installed on. Sees the original outgoing request (URL the caller fetched) and the final
 * response after OkHttp follows redirects — emits one `requestStarted` and one `requestCompleted`
 * per logical fetch.
 *
 * Phase timings (`dnsStart`, `connectStart`, etc.) and body byte counts are captured by
 * `NetworkRequestEventListener` on the network layer (below `BridgeInterceptor` and
 * `GzipSource`) so they reflect real on-the-wire bytes rather than the gunzipped, app-level
 * view our interceptor sees. The interceptor reads (and removes) the per-call timings entry
 * when finalizing the snapshot.
 *
 * Response-body completion is signaled via a thin `BodyCloseSignal` wrapper so finalization
 * waits for the caller to drain the response — by the time the wrapper fires, the listener's
 * `responseBodyEnd` byte count is stable.
 */
class NetworkRequestInterceptor private constructor(
  private val monitor: NetworkRequestMonitor
) : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val originalRequest = chain.request()

    // Recursion guard: telemetry uploads carry this header so they aren't observed in turn. We
    // don't record these, but the per-call event listener still fires for them — its orphaned
    // timings entry is reclaimed by the weak-keyed `inFlightTimings` map (see there).
    if (originalRequest.header(INTERNAL_HEADER_NAME) != null) {
      val stripped = originalRequest.newBuilder().removeHeader(INTERNAL_HEADER_NAME).build()
      return chain.proceed(stripped)
    }

    // Double-instrumentation guard: a downstream interceptor in the same chain may already be us.
    if (originalRequest.tag(AlreadyObservedMarker::class.java) != null) {
      return chain.proceed(originalRequest)
    }

    val observationId = UUID.randomUUID()
    val startedAt = Date()
    val startNanos = System.nanoTime()

    val request = originalRequest.newBuilder()
      .tag(AlreadyObservedMarker::class.java, AlreadyObservedMarker)
      .build()

    monitor.recordStart(NetworkRequestStarted(observationId, originalRequest.url.toString(), originalRequest.method, startedAt))

    var response: Response? = null
    var error: IOException? = null
    var bodySignalingWrapper: BodyCloseSignal? = null
    try {
      val raw = chain.proceed(request)
      // Wrap the response body purely for completion signaling — the wrapper doesn't count
      // bytes (those come from `EventListener.responseBodyEnd`, which fires below `GzipSource`
      // on the real network layer). It just lets us defer `finalizeAndRecord` until the caller
      // drains the body, so the snapshot's byte counts are populated by the time we read them.
      val wrapped = raw.body?.let { rawBody ->
        BodyCloseSignal(rawBody) {
          finalizeAndRecord(
            observationId = observationId,
            originalRequest = originalRequest,
            response = raw,
            call = chain.call(),
            startedAt = startedAt,
            startNanos = startNanos,
            error = null
          )
        }
      }
      response = if (wrapped != null) {
        raw.newBuilder().body(wrapped).build()
      } else {
        raw
      }
      bodySignalingWrapper = wrapped
    } catch (e: IOException) {
      error = e
    }

    // Two paths land here without a streaming body to wait on: an error before headers, and a
    // response with no body (HEAD, 204, 304, ...). Both finalize the snapshot inline.
    if (error != null || bodySignalingWrapper == null) {
      finalizeAndRecord(
        observationId = observationId,
        originalRequest = originalRequest,
        response = response,
        call = chain.call(),
        startedAt = startedAt,
        startNanos = startNanos,
        error = error
      )
    }

    if (error != null) {
      throw error
    }
    return response!!
  }

  private fun finalizeAndRecord(
    observationId: UUID,
    originalRequest: Request,
    response: Response?,
    call: Call,
    startedAt: Date,
    startNanos: Long,
    error: IOException?
  ) {
    val endNanos = System.nanoTime()
    val totalDuration = (endNanos - startNanos) / 1_000_000_000.0
    val endDate = Date(startedAt.time + ((endNanos - startNanos) / 1_000_000L))

    val phases = NetworkRequestEventListener.takeTimings(call)

    val snapshot = buildSnapshot(
      id = observationId,
      originalRequest = originalRequest,
      response = response,
      phases = phases,
      fallbackStart = startedAt,
      fallbackEnd = endDate,
      totalDuration = totalDuration,
      error = error
    )
    monitor.record(snapshot)
  }

  companion object {
    /** Shared interceptor backed by `NetworkRequestMonitor.shared`. App code adds this to its own
     `OkHttpClient.Builder` if it wants those requests observed. */
    val instance: NetworkRequestInterceptor by lazy {
      NetworkRequestInterceptor(NetworkRequestMonitor.shared)
    }

    /** Test-only constructor that lets tests drive a dedicated monitor. */
    internal fun forTesting(monitor: NetworkRequestMonitor): NetworkRequestInterceptor =
      NetworkRequestInterceptor(monitor)
  }
}

/**
 * Builds a `NetworkRequest` snapshot from interceptor outputs. Pulled out so tests can exercise
 * the field-population logic without spinning up a full OkHttp chain.
 *
 * Byte counts come from `EventListener.requestBodyEnd` / `responseBodyEnd` (carried on
 * `phases.requestBodyBytes` / `responseBodyBytes`) — those fire on the network layer and
 * report on-the-wire bytes (including chunked framing and gzip compression). The app-layer
 * `originalRequest.body.contentLength()` and `response.body.contentLength()` are only used as
 * a fallback when the listener didn't fire (no request body, response not consumed, errors
 * before headers). Header bytes are an HTTP/1.1 framing estimate — see
 * `requestHeaderByteCount` / `responseHeaderByteCount` for the caveats.
 */
internal fun buildSnapshot(
  id: UUID,
  originalRequest: Request,
  response: Response?,
  phases: NetworkRequestEventListener.PhaseTimings?,
  fallbackStart: Date,
  fallbackEnd: Date,
  totalDuration: Double,
  error: IOException?
): NetworkRequest {
  val redirects = response?.let { buildRedirectChain(it) } ?: emptyList()

  val requestHeaderBytes = requestHeaderByteCount(originalRequest)
  val responseHeaderBytes = response?.let { responseHeaderByteCount(it) } ?: 0L
  // Prefer the on-the-wire body count reported by `EventListener.{request,response}BodyEnd` —
  // those callbacks fire on the network layer (below `BridgeInterceptor` and `GzipSource`) so
  // they're the truth. Fall back to declared `contentLength()` for callers that never streamed
  // the body and zero otherwise. The `takeIf { it > 0 }` guards `contentLength()`'s sentinel
  // `-1` for unknown sizes.
  val requestBytesSent: Long? = if (response != null || error != null) {
    val body = phases?.requestBodyBytes?.takeIf { it > 0 }
      ?: originalRequest.body?.contentLength()?.takeIf { it > 0 }
      ?: 0L
    requestHeaderBytes + body
  } else null
  val responseBytesReceived: Long? = response?.let {
    val body = phases?.responseBodyBytes?.takeIf { it > 0 }
      ?: it.body?.contentLength()?.takeIf { it > 0 }
      ?: 0L
    responseHeaderBytes + body
  }

  val timings = NetworkRequest.Timings(
    fetchStart = phases?.fetchStart ?: fallbackStart,
    domainLookupStart = phases?.dnsStart,
    domainLookupEnd = phases?.dnsEnd,
    connectStart = phases?.connectStart,
    connectEnd = phases?.connectEnd,
    secureConnectionStart = phases?.secureConnectStart,
    secureConnectionEnd = phases?.secureConnectEnd,
    requestStart = phases?.requestHeadersStart ?: phases?.requestBodyStart,
    requestEnd = phases?.requestBodyEnd ?: phases?.requestHeadersEnd,
    responseStart = phases?.responseHeadersStart,
    responseEnd = phases?.responseBodyEnd ?: phases?.responseHeadersEnd ?: fallbackEnd,
    totalDuration = totalDuration
  )

  return NetworkRequest(
    id = id,
    url = originalRequest.url.toString(),
    method = originalRequest.method,
    statusCode = response?.code,
    networkProtocol = response?.protocol?.toString(),
    requestBytesSent = requestBytesSent,
    responseBytesReceived = responseBytesReceived,
    timings = timings,
    errorDescription = error?.localizedMessage ?: error?.message,
    redirects = redirects
  )
}

/**
 * Walks `Response.priorResponse()` chronologically and emits one `Redirect` per hop. The chain
 * is naturally redirect-only — OkHttp doesn't surface intermediate protocol upgrades through
 * `priorResponse` the way iOS exposes Alt-Svc upgrades through `transactionMetrics`, so no
 * status-code filter is required.
 */
internal fun buildRedirectChain(final: Response): List<NetworkRequest.Redirect> {
  // Collect tuples (priorResponse, nextResponseInChain) walking backwards, then reverse.
  val reversed = mutableListOf<NetworkRequest.Redirect>()
  var next: Response = final
  var prior: Response? = final.priorResponse
  while (prior != null) {
    reversed.add(
      NetworkRequest.Redirect(
        fromUrl = prior.request.url.toString(),
        toUrl = next.request.url.toString(),
        statusCode = prior.code
      )
    )
    next = prior
    prior = prior.priorResponse
  }
  return reversed.reversed()
}

/**
 * OkHttp `EventListener` that captures per-phase timestamps and stashes them in a process-wide
 * map keyed by `Call`. `NetworkRequestInterceptor` reads (and removes) the entry when finalizing
 * the snapshot.
 *
 * Use the factory rather than the bare class so each `Call` gets its own builder; OkHttp shares a
 * single `EventListener` instance across calls otherwise and concurrent writes would race.
 */
class NetworkRequestEventListener : EventListener() {
  private val builder = MutablePhaseTimings()

  override fun callStart(call: Call) {
    builder.fetchStart = Date()
  }

  override fun dnsStart(call: Call, domainName: String) {
    builder.dnsStart = Date()
  }

  override fun dnsEnd(call: Call, domainName: String, inetAddressList: List<InetAddress>) {
    builder.dnsEnd = Date()
  }

  override fun connectStart(call: Call, inetSocketAddress: InetSocketAddress, proxy: Proxy) {
    builder.connectStart = Date()
  }

  override fun secureConnectStart(call: Call) {
    builder.secureConnectStart = Date()
  }

  override fun secureConnectEnd(call: Call, handshake: Handshake?) {
    builder.secureConnectEnd = Date()
  }

  override fun connectEnd(call: Call, inetSocketAddress: InetSocketAddress, proxy: Proxy, protocol: Protocol?) {
    builder.connectEnd = Date()
  }

  override fun requestHeadersStart(call: Call) {
    builder.requestHeadersStart = Date()
  }

  override fun requestHeadersEnd(call: Call, request: Request) {
    builder.requestHeadersEnd = Date()
  }

  override fun requestBodyStart(call: Call) {
    builder.requestBodyStart = Date()
  }

  override fun requestBodyEnd(call: Call, byteCount: Long) {
    builder.requestBodyEnd = Date()
    builder.requestBodyBytes = byteCount
  }

  override fun responseHeadersStart(call: Call) {
    builder.responseHeadersStart = Date()
  }

  override fun responseHeadersEnd(call: Call, response: Response) {
    builder.responseHeadersEnd = Date()
  }

  override fun responseBodyEnd(call: Call, byteCount: Long) {
    builder.responseBodyEnd = Date()
    builder.responseBodyBytes = byteCount
  }

  override fun callEnd(call: Call) {
    publish(call)
  }

  override fun callFailed(call: Call, ioe: IOException) {
    publish(call)
  }

  override fun canceled(call: Call) {
    publish(call)
  }

  private fun publish(call: Call) {
    synchronized(inFlightTimings) {
      inFlightTimings[call] = builder.snapshot()
    }
  }

  /**
   * Mutable per-phase scratch space the listener writes into as the call progresses. A separate
   * type from `PhaseTimings` so the published value (read by the interceptor) is immutable.
   */
  internal class MutablePhaseTimings(
    @Volatile var fetchStart: Date? = null,
    @Volatile var dnsStart: Date? = null,
    @Volatile var dnsEnd: Date? = null,
    @Volatile var connectStart: Date? = null,
    @Volatile var connectEnd: Date? = null,
    @Volatile var secureConnectStart: Date? = null,
    @Volatile var secureConnectEnd: Date? = null,
    @Volatile var requestHeadersStart: Date? = null,
    @Volatile var requestHeadersEnd: Date? = null,
    @Volatile var requestBodyStart: Date? = null,
    @Volatile var requestBodyEnd: Date? = null,
    @Volatile var responseHeadersStart: Date? = null,
    @Volatile var responseHeadersEnd: Date? = null,
    @Volatile var responseBodyEnd: Date? = null,
    @Volatile var requestBodyBytes: Long? = null,
    @Volatile var responseBodyBytes: Long? = null
  ) {
    fun snapshot() = PhaseTimings(
      fetchStart, dnsStart, dnsEnd,
      connectStart, connectEnd,
      secureConnectStart, secureConnectEnd,
      requestHeadersStart, requestHeadersEnd,
      requestBodyStart, requestBodyEnd,
      responseHeadersStart, responseHeadersEnd,
      responseBodyEnd,
      requestBodyBytes, responseBodyBytes
    )
  }

  /**
   * Per-phase wire timestamps captured from OkHttp's `EventListener` callbacks. The interceptor
   * folds these into the broader `NetworkRequest.Timings` at finalize time; the latter is the
   * iOS-mirrored snapshot shape and the only one JS ever sees.
   *
   * `requestBodyBytes` and `responseBodyBytes` come from `EventListener.requestBodyEnd` /
   * `responseBodyEnd`, which fire on the *network* layer — below `BridgeInterceptor` and
   * `GzipSource`. They report the bytes actually on the wire, not the (gunzipped, app-layer)
   * view that the interceptor sees. `null` means the corresponding body-end callback never
   * fired (no request body / response not fully consumed / error before headers).
   */
  data class PhaseTimings(
    val fetchStart: Date?,
    val dnsStart: Date?,
    val dnsEnd: Date?,
    val connectStart: Date?,
    val connectEnd: Date?,
    val secureConnectStart: Date?,
    val secureConnectEnd: Date?,
    val requestHeadersStart: Date?,
    val requestHeadersEnd: Date?,
    val requestBodyStart: Date?,
    val requestBodyEnd: Date?,
    val responseHeadersStart: Date?,
    val responseHeadersEnd: Date?,
    val responseBodyEnd: Date?,
    val requestBodyBytes: Long?,
    val responseBodyBytes: Long?
  )

  companion object {
    /**
     * Process-wide map of in-flight call timings. Lifecycle: the listener writes one entry per
     * call when the call ends, the interceptor reads + removes when it builds the snapshot.
     *
     * Keyed weakly on `Call` so any entry the interceptor never takes is reclaimed once the `Call`
     * is collected, rather than pinned forever. That covers the paths where `finalizeAndRecord`
     * doesn't run for a call the listener still reported on: the recursion / double-instrumentation
     * guards that short-circuit to `chain.proceed(...)` without recording, and responses whose body
     * the caller never drains or closes. `Call` doesn't override `equals`/`hashCode`, so the map
     * keys on identity as intended.
     *
     * `WeakHashMap` isn't thread-safe and OkHttp drives the listener from a pool of dispatcher
     * threads, so every access goes through `synchronized`.
     */
    private val inFlightTimings = WeakHashMap<Call, PhaseTimings>()

    /** Removes and returns the timings for `call`, or `null` if none were recorded. */
    internal fun takeTimings(call: Call): PhaseTimings? = synchronized(inFlightTimings) {
      inFlightTimings.remove(call)
    }

    /** Factory that installs a fresh listener per call. Wire to `OkHttpClient.Builder.eventListenerFactory(...)`. */
    val factory: EventListener.Factory = EventListener.Factory { NetworkRequestEventListener() }
  }
}

/**
 * Wraps the response body to signal when the caller finishes draining it. Doesn't count bytes
 * — those come from `EventListener.responseBodyEnd` (the network layer, below `GzipSource`),
 * which fires before the caller's close/EOF on the app layer. This wrapper exists purely so
 * the interceptor can defer `finalizeAndRecord` until the byte counters on `PhaseTimings` are
 * stable.
 */
private class BodyCloseSignal(
  private val delegate: ResponseBody,
  private val onComplete: () -> Unit
) : ResponseBody() {
  @Volatile
  private var completed: Boolean = false

  // OkHttp's contract returns the same `BufferedSource` on repeated `source()` calls, so we
  // cache ours too — wrapping twice would fire the completion callback twice.
  private val signalingSource: BufferedSource by lazy {
    object : ForwardingSource(delegate.source()) {
      override fun read(sink: Buffer, byteCount: Long): Long {
        val read = super.read(sink, byteCount)
        if (read == -1L) {
          // Body fully drained — fire the completion callback exactly once. Callers that close
          // the stream without reaching EOF still trigger completion via the `close()` override.
          fireCompleteOnce()
        }
        return read
      }

      override fun close() {
        fireCompleteOnce()
        super.close()
      }
    }.buffer()
  }

  override fun contentType(): MediaType? = delegate.contentType()
  override fun contentLength(): Long = delegate.contentLength()
  override fun source(): BufferedSource = signalingSource

  private fun fireCompleteOnce() {
    if (completed) {
      return
    }
    completed = true
    onComplete()
  }
}

/**
 * Approximates the number of bytes the request headers occupy on the wire - the HTTP/1.1 request
 * line (`METHOD path HTTP/1.1\r\n`) plus the serialized header block (`Name: Value\r\n` per
 * header and the trailing CRLF that terminates the block).
 *
 * iOS gets exact numbers from `URLSessionTaskTransactionMetrics.countOfRequestHeaderBytesSent`.
 * Android has no equivalent — `EventListener.requestHeadersEnd` carries a `Request` object, but
 * it's the application-layer view (the one our interceptor receives), not the post-
 * `BridgeInterceptor` request that's actually sent. Headers OkHttp adds below us
 * (`Host`, `Accept-Encoding`, `User-Agent`, `Connection`, `Content-Length`) are missing from
 * this count, so we undercount by roughly 80–150 bytes per request on HTTP/1.1.
 *
 * HTTP/2 and HTTP/3 use HPACK/QPACK header compression and a binary framing layer; on those
 * protocols the comparison to "wire bytes" is fundamentally fuzzy regardless. We accept the
 * imprecision rather than reach into OkHttp internals.
 */
private fun requestHeaderByteCount(request: Request): Long {
  // "METHOD " + encodedPathQuery + " HTTP/1.1\r\n"
  val pathLength = request.url.encodedPath.length +
    (request.url.encodedQuery?.let { it.length + 1 } ?: 0)
  val requestLine = request.method.length + 1 + pathLength + 1 + "HTTP/1.1".length + 2
  return requestLine + serializedHeaderBytes(request.headers)
}

/**
 * Same approximation as `requestHeaderByteCount` but for the response side: the status line
 * (`HTTP/1.1 STATUSCODE REASON\r\n`) plus the serialized header block.
 */
private fun responseHeaderByteCount(response: Response): Long {
  val statusLine = response.protocol.toString().length + 1 +
    response.code.toString().length + 1 +
    response.message.length + 2
  return statusLine + serializedHeaderBytes(response.headers)
}

/**
 * Serialized size of an HTTP/1.1 header block: `Name: Value\r\n` per header plus the trailing
 * `\r\n` that terminates the block. OkHttp 4.10+ ships `Headers.byteCount()` natively; we
 * implement it ourselves because we're pinned to 4.9.2 (matches RN's pin).
 */
private fun serializedHeaderBytes(headers: Headers): Long {
  var total = 2L // trailing CRLF terminating the header block
  for (i in 0 until headers.size) {
    total += headers.name(i).length + 2 + headers.value(i).length + 2
  }
  return total
}

