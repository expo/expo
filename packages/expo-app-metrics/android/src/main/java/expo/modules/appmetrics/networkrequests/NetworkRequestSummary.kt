// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/**
 * Aggregate over a set of `NetworkRequest` snapshots. Designed to be flattened into a metric's
 * `params` map, so all fields are simple value types.
 *
 * The summary is intentionally small. Anything that would explode cardinality (per-URL p95s, full
 * request lists) belongs in a separate metric/table once we ship one - not on the TTI envelope.
 */
data class NetworkRequestSummary(
  /** Number of requests in the window. */
  val count: Int,

  /** Requests that errored or returned a non-2xx status. */
  val failed: Int,

  /**
   * Subset of `failed` where the network stalled or went away rather than the server answering.
   *
   * Split out from `failed` because the two have different causes: timeouts point at the
   * connection, 4xx/5xx point at the backend. A window where most failures are timeouts is the
   * clearest signal available here that the user was on a bad network.
   */
  val timedOut: Int = 0,

  /** Sum of `responseBytesReceived` across all requests. */
  val bytesReceived: Long,

  /** Sum of `requestBytesSent` across all requests. */
  val bytesSent: Long,

  /** Sum of `timings.totalDuration` across all requests, in seconds. Can exceed wall-clock when requests overlap. */
  val totalDuration: Double,

  /** Longest single request duration in seconds, or `null` if `count == 0`. */
  val slowestDuration: Double?,

  /** Host of the slowest request, or `null` if the URL had no resolvable host. */
  val slowestHost: String?,

  /**
   * Longest time-to-first-byte in the window in seconds, or `null` if no request reported one.
   *
   * A maximum rather than an average, so a single stalled request stays visible instead of being
   * diluted by fast ones. Note this includes server processing time, so it's a proxy for network
   * quality rather than a measurement of it - see `Timings.timeToFirstByte`.
   */
  val slowestTimeToFirstByte: Double? = null,

  /**
   * Received bytes over the time the network was actually busy, in bytes per second, or `null` when
   * nothing was received or no request reported a usable interval.
   *
   * The denominator is the union of the request intervals, not the sum of their durations and not
   * the elapsed window. Summing durations would divide by the app's request concurrency, so four
   * parallel one-second requests would report a quarter of the real rate. Using the whole window
   * would charge idle time to the network, so a launch that fetches briefly and then sits idle would
   * look slow. Measuring only the busy span leaves a value that moves when the connection changes
   * and holds still when the app's fetch pattern does.
   *
   * This still can't see a stall between requests: if the radio dies while nothing is in flight, no
   * interval covers it. `timedOut` is the signal for that case.
   */
  val throughputBytesPerSecond: Double? = null,

  /**
   * Shortest TCP handshake in the window in seconds, or `null` if every connection was reused.
   *
   * A minimum rather than an average: a handshake that loses its SYN retries after a timeout of a
   * second or more, so a mean over a few handshakes mostly reports retransmits. The fastest one
   * approximates the true path latency.
   */
  val fastestTcpHandshake: Double? = null
) {
  val isEmpty: Boolean
    get() = count == 0

  companion object {
    val empty = NetworkRequestSummary(
      count = 0,
      failed = 0,
      timedOut = 0,
      bytesReceived = 0,
      bytesSent = 0,
      totalDuration = 0.0,
      slowestDuration = null,
      slowestHost = null,
      slowestTimeToFirstByte = null,
      throughputBytesPerSecond = null,
      fastestTcpHandshake = null
    )

    /**
     * Folds a list of `NetworkRequest` into a summary. The caller is responsible for filtering
     * the list to the desired window.
     */
    fun from(requests: List<NetworkRequest>): NetworkRequestSummary {
      if (requests.isEmpty()) {
        return empty
      }
      var failed = 0
      var timedOut = 0
      var bytesReceived = 0L
      var bytesSent = 0L
      var totalDuration = 0.0
      var slowest: NetworkRequest? = null
      var slowestTimeToFirstByte: Double? = null
      var fastestTcpHandshake: Double? = null

      for (request in requests) {
        if (request.isFailed) {
          failed += 1
        }
        if (request.isTimeout) {
          timedOut += 1
        }
        bytesReceived += request.responseBytesReceived ?: 0
        bytesSent += request.requestBytesSent ?: 0
        totalDuration += request.timings.totalDuration
        val current = slowest
        if (current == null || request.timings.totalDuration > current.timings.totalDuration) {
          slowest = request
        }
        // Both folds skip requests that didn't report the phase, so a reused connection or a
        // header-less failure doesn't drag the result toward a value that was never measured.
        request.timings.timeToFirstByte?.let {
          slowestTimeToFirstByte = maxOf(it, slowestTimeToFirstByte ?: it)
        }
        request.timings.tcpHandshakeDuration?.let {
          fastestTcpHandshake = minOf(it, fastestTcpHandshake ?: it)
        }
      }

      return NetworkRequestSummary(
        count = requests.size,
        failed = failed,
        timedOut = timedOut,
        bytesReceived = bytesReceived,
        bytesSent = bytesSent,
        totalDuration = totalDuration,
        slowestDuration = slowest?.timings?.totalDuration,
        slowestHost = slowest?.url?.toHttpUrlOrNull()?.host,
        slowestTimeToFirstByte = slowestTimeToFirstByte,
        throughputBytesPerSecond = throughput(bytesReceived, requests),
        fastestTcpHandshake = fastestTcpHandshake
      )
    }

    /**
     * Received bytes over the time at least one request was in flight. Returns `null` when nothing
     * was received or no request reported a usable interval, so the caller can tell "unknown" from
     * a genuinely slow connection.
     */
    private fun throughput(bytesReceived: Long, requests: List<NetworkRequest>): Double? {
      if (bytesReceived <= 0) {
        return null
      }
      val busySeconds = busyDuration(requests)
      if (busySeconds <= 0) {
        return null
      }
      return bytesReceived.toDouble() / busySeconds
    }

    /**
     * Total length of the union of the requests' in-flight intervals, in seconds.
     *
     * Overlapping requests are merged so concurrency doesn't inflate the total, and gaps between
     * requests are excluded so idle time isn't charged to the network. Requests missing either
     * endpoint are skipped rather than treated as zero-length.
     */
    private fun busyDuration(requests: List<NetworkRequest>): Double {
      val intervals = requests
        .mapNotNull { request ->
          val start = request.timings.fetchStart ?: return@mapNotNull null
          val end = request.timings.responseEnd ?: return@mapNotNull null
          if (end.time >= start.time) start.time to end.time else null
        }
        .sortedBy { it.first }

      var totalMillis = 0L
      var spanStart: Long? = null
      var spanEnd: Long? = null
      for ((start, end) in intervals) {
        val currentStart = spanStart
        val currentEnd = spanEnd
        if (currentStart == null || currentEnd == null) {
          spanStart = start
          spanEnd = end
          continue
        }
        if (start <= currentEnd) {
          // Overlaps (or touches) the open span, so extend it instead of counting the time twice.
          spanEnd = maxOf(currentEnd, end)
        } else {
          totalMillis += currentEnd - currentStart
          spanStart = start
          spanEnd = end
        }
      }
      spanStart?.let { start -> spanEnd?.let { end -> totalMillis += end - start } }
      return totalMillis / 1000.0
    }
  }
}

/**
 * A request is treated as failed if it errored, or returned a 4xx (client error) or 5xx (server
 * error) status. 1xx (informational), 2xx (success), and 3xx (redirection — usually followed
 * transparently by OkHttp, but the unfollowed case is still a successful response from the
 * origin's perspective) are not failures. A missing status code (the request failed before
 * headers arrived) counts as failed.
 */
internal val NetworkRequest.isFailed: Boolean
  get() {
    if (errorDescription != null) {
      return true
    }
    val code = statusCode ?: return true
    return code >= 400
  }
