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

  /**
   * Sum of `timings.totalDuration` across all requests, in seconds. Can exceed wall-clock when
   * requests overlap.
   *
   * Deliberately includes failures, unlike `slowest` and `throughputBytesPerSecond`, which describe
   * only requests that completed. That makes it the one field that still accounts for time the app
   * spent waiting on a request that never arrived: a window of timeouts reports the seconds they
   * burned here even though nothing else measures them. The cost is that it can dwarf the other
   * timings, since a single timeout contributes the client's whole timeout interval.
   */
  val totalDuration: Double,

  /**
   * The single longest-running request that completed, or `null` when the window held none.
   *
   * Every field describes that one request, so they can be read together: a `duration` mostly made
   * up of `timeToFirstByte` means the server was slow to answer, while a small `timeToFirstByte`
   * against a large `bytesReceived` means the transfer itself was. `statusCode` explains a
   * `bytesReceived` of 0, which is routine on a 304 and a problem on a 200.
   *
   * Failed requests are deliberately not candidates. A timeout's duration is the client's timeout
   * setting rather than a measurement of the server, so letting one win would make these fields
   * report a config constant that barely varies with the network. `failed` and `timedOut` carry that
   * signal instead.
   */
  val slowest: SlowestRequest? = null,

  /**
   * Received bytes over the time those bytes were actually moving, in bytes per second, or `null`
   * when nothing was received or no receiving request reported a usable interval.
   *
   * The denominator is the union of the transfer windows of the requests that received bytes, each
   * running from the first response byte to the last. Four choices are folded into that:
   *
   * - The transfer window rather than the whole request, so time spent resolving DNS, connecting,
   *   and waiting on the server isn't charged to the connection. A request that waits four seconds
   *   on a backend and then delivers a kilobyte instantly describes a fast network, not a slow one;
   *   the wait belongs to `slowest.timeToFirstByte`.
   * - A union rather than a sum of durations, so request concurrency doesn't inflate it. Four
   *   parallel one-second requests would otherwise report a quarter of the real rate.
   * - The busy span rather than the whole window, so idle time isn't charged to the network. A
   *   launch that fetches briefly and then sits idle would otherwise look slow.
   * - Only requests that completed and received bytes, so neither a slow request returning nothing
   *   nor one that stalled until the client gave up can stretch the denominator across time when no
   *   payload was in flight. Their latency belongs to `slowest.timeToFirstByte` and `timedOut`.
   *
   * Requiring a first-byte timestamp also excludes cache hits for free: a response served from disk
   * never reports one, so the bytes it contributes can't be divided by the milliseconds it took to
   * read them.
   *
   * This still can't see a stall between requests: if the radio dies while nothing is in flight, no
   * interval covers it. `timedOut` is the signal for that case.
   *
   * Being a ratio, it also degrades differently from the counts when the monitor's ring buffer evicts
   * the earliest requests in a window: both sides shrink together, so the value stays plausible while
   * describing only the requests that survived. Read it as the rate of a sample of the window rather
   * than of all of it.
   */
  val throughputBytesPerSecond: Double? = null
) {
  /** Facts about the slowest completed request in a window. See `NetworkRequestSummary.slowest`. */
  data class SlowestRequest(
    /** Host of the request, or `null` if the URL had no resolvable host. */
    val host: String?,

    /** Total wall-clock duration of the request, in seconds. */
    val duration: Double,

    /**
     * Response status code. Never `null` in practice, since a request that never received headers
     * counts as failed and so isn't a candidate.
     *
     * Disambiguates an empty response: a `bytesReceived` of 0 means a cache revalidation on a 304,
     * an intentionally bodyless reply on a 204, and a broken transfer on a 200.
     */
    val statusCode: Int?,

    /**
     * Time from the start of the fetch until the first response byte arrived, in seconds, or `null`
     * if the request never reported one. Includes server processing time, so it's a proxy for
     * network quality rather than a measurement of it - see `Timings.timeToFirstByte`.
     */
    val timeToFirstByte: Double?,

    /**
     * Response bytes received on the wire, or `null` if no count was reported. Distinguishes a
     * request that was slow because it moved a lot of data from one that was slow while idle.
     */
    val bytesReceived: Long?
  )

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
      slowest = null,
      throughputBytesPerSecond = null
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
        // Only completed requests are candidates. A timeout's duration is the client's timeout
        // setting, not a measurement of the server, so letting one win would make these fields
        // report a config constant that barely varies with the network. Failures are already counted
        // by `failed` and `timedOut`.
        if (!request.isFailed) {
          val current = slowest
          if (current == null || request.timings.totalDuration > current.timings.totalDuration) {
            slowest = request
          }
        }
      }

      return NetworkRequestSummary(
        count = requests.size,
        failed = failed,
        timedOut = timedOut,
        bytesReceived = bytesReceived,
        bytesSent = bytesSent,
        totalDuration = totalDuration,
        slowest = slowest?.let { request ->
          SlowestRequest(
            host = request.url.toHttpUrlOrNull()?.host,
            duration = request.timings.totalDuration,
            statusCode = request.statusCode,
            timeToFirstByte = request.timings.timeToFirstByte,
            bytesReceived = request.responseBytesReceived
          )
        },
        throughputBytesPerSecond = throughput(requests)
      )
    }

    /**
     * Received bytes over the time those bytes were moving. Returns `null` when nothing was received
     * or no receiving request reported a usable interval, so the caller can tell "unknown" from a
     * genuinely slow connection.
     *
     * Both sides are computed from the same subset, so the numerator and denominator always describe
     * the same traffic.
     */
    private fun throughput(requests: List<NetworkRequest>): Double? {
      val measurable = measurableReceiving(requests)
      val bytes = measurable.sumOf { it.responseBytesReceived ?: 0 }
      if (bytes <= 0) {
        return null
      }
      val busySeconds = busyDuration(measurable)
      if (busySeconds <= 0) {
        return null
      }
      return bytes.toDouble() / busySeconds
    }

    /**
     * The requests that completed, received bytes, and reported a measurable transfer window, which
     * is the subset the throughput ratio is computed over.
     *
     * Deciding it once keeps the numerator and denominator describing the same traffic. Filtering
     * inside the busy-time fold instead would let a request contribute its bytes while adding no
     * time, which reads as a faster connection than actually happened. A cache hit is the case that
     * matters: it reports bytes from the task counters but is served from disk, so it never gets a
     * first-byte timestamp and drops out here.
     *
     * Failures are excluded for the opposite reason. A request that received a few bytes and then
     * stalled until the client gave up reports a window covering the whole stall, so it would hold
     * the denominator open across time when nothing was moving and report a connection far slower than
     * the one that served the requests around it.
     */
    private fun measurableReceiving(requests: List<NetworkRequest>): List<NetworkRequest> {
      return requests.filter { request ->
        val start = request.timings.responseStart
        val end = request.timings.responseEnd
        !request.isFailed && (request.responseBytesReceived ?: 0) > 0 && start != null &&
          end != null && end.time > start.time
      }
    }

    /**
     * Total length of the union of the requests' in-flight intervals, in seconds.
     *
     * Overlapping requests are merged so concurrency doesn't inflate the total, and gaps between
     * requests are excluded so idle time isn't charged to the network.
     *
     * Requests are skipped unless they report both endpoints and a strictly positive span. A
     * collapsed interval would otherwise let a request contribute its bytes to the numerator while
     * adding nothing to the denominator, which reads as a faster connection than actually happened.
     * A cache hit is the case that matters: it reports bytes from the task counters but is served
     * from disk inside one clock tick.
     */
    private fun busyDuration(requests: List<NetworkRequest>): Double {
      val intervals = requests
        .mapNotNull { request ->
          val start = request.timings.responseStart ?: return@mapNotNull null
          val end = request.timings.responseEnd ?: return@mapNotNull null
          if (end.time > start.time) start.time to end.time else null
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
