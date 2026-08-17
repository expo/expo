// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import java.util.Date
import java.util.UUID

/**
 * Snapshot of an HTTP request seen by `NetworkRequestInterceptor`.
 * Matches the iOS `NetworkRequest` struct so request data is consistent across platforms.
 *
 * The URL is stored as-is, including query parameters. Any redaction of sensitive data
 * (for example, query parameter tokens or auth headers) must be handled by downstream code
 * before the request is stored or reported.
 */
data class NetworkRequest(
  /** Stable identifier for this observation. */
  val id: UUID,

  /** Request URL as supplied to OkHttp. May include query parameters and fragments. */
  val url: String,

  /** HTTP method (`GET`, `POST`, …). */
  val method: String,

  /** Response status code, or `null` if the request failed before headers were received. */
  val statusCode: Int?,

  /** Negotiated wire protocol - `http/1.1`, `h2`, `h3` - as reported by OkHttp's `Protocol`. */
  val networkProtocol: String?,

  /** Number of bytes sent on the wire for the request (headers + body). */
  val requestBytesSent: Long?,

  /**
   * Number of bytes received on the wire for the response (headers + body), or `null` when the
   * size wasn't reported: the request failed before a response, or the caller abandoned the body
   * of a response that declared no `Content-Length`. Zero means a genuinely empty body.
   */
  val responseBytesReceived: Long?,

  /** Phase-by-phase timings, populated from OkHttp `EventListener` callbacks where available. */
  val timings: Timings,

  /**
   * How OkHttp satisfied the request, or `null` when nothing classified it (the request failed
   * before a response). A cached response is byte-counted and timestamped like a download, so
   * this is the only way to tell a disk read from a transfer.
   */
  val fetchType: FetchType? = null,

  /**
   * Short human-readable error description if the request completed with an exception. Kept as a
   * string rather than carrying the throwable so the type stays serializable.
   */
  val errorDescription: String?,

  /**
   * Whether the request ended because the caller canceled it (`Call.isCanceled()` at capture
   * time). Cancellations are recorded as spans but are not errors, per the OTel conventions:
   * RN apps abort requests routinely (`AbortController`, prefetch aborts).
   */
  val canceled: Boolean = false,

  /**
   * Fully qualified class name of the completion exception (e.g. `java.net.UnknownHostException`),
   * or `null` when the request completed without one. Unlike `errorDescription`, which is
   * localized free text, this stays constant across locales, so telemetry can group failures by
   * it, because it feeds the low-cardinality `error.type` attribute of OpenTelemetry's semantic
   * conventions. Mirrors the iOS `errorType` (`domain:code` there).
   */
  val errorType: String? = null,

  /**
   * Ordered list of redirect hops that preceded the final response. Empty when the request landed
   * directly. Each entry's `fromUrl` is the URL that returned the redirect, `toUrl` is where the
   * redirect pointed, `statusCode` is the 3xx code that caused the hop, and `respondedAtMs` is
   * when that 3xx response arrived.
   */
  val redirects: List<Redirect>
) {
  /**
   * How a response was produced, derived from OkHttp's `cacheResponse` / `networkResponse` pair.
   * Mirrors the iOS `NetworkRequest.FetchType`, which reports an HTTP/2 server push that OkHttp
   * does not surface, and folds [VALIDATED] into [CACHE].
   */
  enum class FetchType(val attributeValue: String) {
    /** Fetched over the network. */
    NETWORK("network"),

    /** Served from the OkHttp cache without touching the network. */
    CACHE("cache"),

    /** Revalidated with a conditional request, then served from the cache (a 304). */
    VALIDATED("validated")
  }

  data class Redirect(
    /** The URL that returned the redirect. */
    val fromUrl: String,
    /** The URL the request was redirected to. */
    val toUrl: String,
    /** The 3xx status code returned by `fromUrl` that caused this hop. */
    val statusCode: Int,
    /**
     * Unix-epoch milliseconds when the 3xx response headers arrived (OkHttp's
     * `receivedResponseAtMillis`), or `null` when OkHttp did not report it.
     */
    val respondedAtMs: Long? = null
  )

  data class Timings(
    /** When the request was dispatched (interceptor entry). */
    val fetchStart: Date?,

    /** When DNS resolution began. `null` if the host was resolved from cache or the connection was reused. */
    val domainLookupStart: Date?,
    val domainLookupEnd: Date?,

    /** When the TCP connection began. `null` if a connection was reused. */
    val connectStart: Date?,
    val connectEnd: Date?,

    /** TLS handshake window. `null` for cleartext or reused connections. */
    val secureConnectionStart: Date?,
    val secureConnectionEnd: Date?,

    /** When the request line/headers began being sent. */
    val requestStart: Date?,
    val requestEnd: Date?,

    /** When the first byte of the response arrived (TTFB). */
    val responseStart: Date?,
    val responseEnd: Date?,

    /**
     * When the last response byte arrived, or `null` if the listener never reported one.
     *
     * Unlike `responseEnd`, this is never synthesized. `responseEnd` falls back to a wall-clock
     * timestamp taken when the snapshot was recorded, which is right for a duration but wrong for a
     * transfer window: a request that got headers and then died reports an end long after its last
     * byte, and dividing its bytes by that window describes the recording delay rather than the
     * connection.
     *
     * Also what keeps cache hits out of the throughput ratio: OkHttp skips the response-body
     * callbacks for a cached response, so this stays `null` and the request drops out. See
     * [fetchType] for how the response was produced, which both platforms report.
     */
    val measuredResponseEnd: Date?,

    /**
     * Total wall-clock duration of the request in seconds. Convenience: callers don't have to
     * subtract `fetchStart` from `responseEnd` themselves, and we can populate this even when
     * individual phases are `null` (cache hits, errors before headers).
     */
    val totalDuration: Double
  ) {
    /**
     * Time from the start of the fetch until the first response byte arrived, in seconds.
     *
     * This is not a measurement of network latency: it also covers DNS, the TCP and TLS handshakes,
     * sending the request, and the server's own processing time. A slow backend inflates it the same
     * way a slow network does. On a reused connection (the common case under keep-alive) the
     * handshakes are already done, so it sits much closer to one round trip plus server time.
     *
     * `null` when the response never produced headers, so callers can tell "not measured" from a
     * genuinely fast response.
     */
    val timeToFirstByte: Double?
      get() = positiveInterval(fetchStart, responseStart)

    /**
     * Returns the interval between two nullable timestamps in seconds, or `null` if either is
     * missing or the result isn't strictly positive.
     *
     * Negative results are discarded because these are wall-clock dates and a clock adjustment
     * mid-request can invert them. Exactly zero is discarded too: a phase that completes inside one
     * clock tick was too fast to measure, and reporting `0` would claim it took no time at all.
     */
    private fun positiveInterval(start: Date?, end: Date?): Double? {
      if (start == null || end == null) {
        return null
      }
      val seconds = (end.time - start.time) / 1000.0
      return if (seconds > 0) seconds else null
    }
  }
}

/**
 * Lightweight snapshot emitted when a request begins, before any response or timing data exists.
 * Shares its `id` with the corresponding completion-time `NetworkRequest`, so JS subscribers can
 * correlate the two events.
 */
data class NetworkRequestStarted(
  val id: UUID,
  val url: String,
  val method: String,
  val startedAt: Date
)
