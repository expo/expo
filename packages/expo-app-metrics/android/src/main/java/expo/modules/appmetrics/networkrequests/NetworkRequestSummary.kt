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

  /** Sum of `responseBytesReceived` across all requests. */
  val bytesReceived: Long,

  /** Sum of `requestBytesSent` across all requests. */
  val bytesSent: Long,

  /** Sum of `timings.totalDuration` across all requests, in seconds. Can exceed wall-clock when requests overlap. */
  val totalDuration: Double,

  /** Longest single request duration in seconds, or `null` if `count == 0`. */
  val slowestDuration: Double?,

  /** Host of the slowest request, or `null` if the URL had no resolvable host. */
  val slowestHost: String?
) {
  val isEmpty: Boolean
    get() = count == 0

  companion object {
    val empty = NetworkRequestSummary(
      count = 0,
      failed = 0,
      bytesReceived = 0,
      bytesSent = 0,
      totalDuration = 0.0,
      slowestDuration = null,
      slowestHost = null
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
      var bytesReceived = 0L
      var bytesSent = 0L
      var totalDuration = 0.0
      var slowest: NetworkRequest? = null

      for (request in requests) {
        if (request.isFailed) {
          failed += 1
        }
        bytesReceived += request.responseBytesReceived ?: 0
        bytesSent += request.requestBytesSent ?: 0
        totalDuration += request.timings.totalDuration
        val current = slowest
        if (current == null || request.timings.totalDuration > current.timings.totalDuration) {
          slowest = request
        }
      }

      return NetworkRequestSummary(
        count = requests.size,
        failed = failed,
        bytesReceived = bytesReceived,
        bytesSent = bytesSent,
        totalDuration = totalDuration,
        slowestDuration = slowest?.timings?.totalDuration,
        slowestHost = slowest?.url?.toHttpUrlOrNull()?.host
      )
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
