// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import java.util.Date
import java.util.UUID

/**
 * Snapshot of a single HTTP request observed by `NetworkRequestInterceptor`. Mirrors the iOS
 * `NetworkRequest` struct field-for-field so the JS payload is symmetric across platforms.
 *
 * The URL is recorded verbatim — including the query string — because callers asked for it. Any
 * redaction (tokens in query parameters, auth headers, etc.) is the responsibility of whatever
 * downstream layer converts these snapshots into stored metrics.
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

  /** Negotiated wire protocol — `http/1.1`, `h2`, `h3` — as reported by OkHttp's `Protocol`. */
  val networkProtocol: String?,

  /** Number of bytes sent on the wire for the request (headers + body). */
  val requestBytesSent: Long?,

  /** Number of bytes received on the wire for the response (headers + body). */
  val responseBytesReceived: Long?,

  /** Phase-by-phase timings, populated from OkHttp `EventListener` callbacks where available. */
  val timings: Timings,

  /**
   * Short human-readable error description if the request completed with an exception. Kept as a
   * string rather than carrying the throwable so the type stays serializable.
   */
  val errorDescription: String?,

  /**
   * Ordered list of redirect hops that preceded the final response. Empty when the request landed
   * directly. Each entry's `fromUrl` is the URL that returned the redirect, `toUrl` is where the
   * redirect pointed, and `statusCode` is the 3xx code that caused the hop.
   */
  val redirects: List<Redirect>
) {
  data class Redirect(
    /** The URL that returned the redirect. */
    val fromUrl: String,
    /** The URL the request was redirected to. */
    val toUrl: String,
    /** The 3xx status code returned by `fromUrl` that caused this hop. */
    val statusCode: Int
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
     * Total wall-clock duration of the request in seconds. Convenience: callers don't have to
     * subtract `fetchStart` from `responseEnd` themselves, and we can populate this even when
     * individual phases are `null` (cache hits, errors before headers).
     */
    val totalDuration: Double
  )
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
