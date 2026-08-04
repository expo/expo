// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// An aggregate over a set of `NetworkRequest` snapshots. Designed to be flattened into a metric's
/// `params` map, so all fields are simple value types and the type itself stays `Sendable`.
///
/// The summary is intentionally small. Anything that would explode cardinality (per-URL p95s, full
/// request lists) belongs in a separate metric/table once we ship one — not on the TTI envelope.
public struct NetworkRequestSummary: Sendable, Equatable {
  /// Number of requests in the window.
  public let count: Int

  /// Requests that errored or returned a non-2xx status.
  public let failed: Int

  /// Subset of `failed` where the network stalled or went away rather than the server answering.
  ///
  /// Split out from `failed` because the two have different causes: timeouts point at the
  /// connection, 4xx/5xx point at the backend. A window where most failures are timeouts is the
  /// clearest signal available here that the user was on a bad network.
  public let timedOut: Int

  /// Sum of `responseBytesReceived` across all requests in the window.
  public let bytesReceived: Int64

  /// Sum of `requestBytesSent` across all requests in the window.
  public let bytesSent: Int64

  /// Sum of `timings.totalDuration` across all requests. Can exceed wall-clock when requests overlap.
  public let totalDuration: TimeInterval

  /// Longest single request duration in the window, or `nil` if `count == 0`.
  public let slowestDuration: TimeInterval?

  /// Host of the slowest request, or `nil` if the request had no resolvable host.
  public let slowestHost: String?

  /// Longest time-to-first-byte in the window, or `nil` if no request reported one.
  ///
  /// A maximum rather than an average, so a single stalled request stays visible instead of being
  /// diluted by fast ones. Note this includes server processing time, so it's a proxy for network
  /// quality rather than a measurement of it — see `Timings.timeToFirstByte`.
  public let slowestTimeToFirstByte: TimeInterval?

  /// Received bytes over the time the network was actually busy, in bytes per second, or `nil` when
  /// nothing was received or no request reported a usable interval.
  ///
  /// The denominator is the union of the request intervals, not the sum of their durations and not
  /// the elapsed window. Summing durations would divide by the app's request concurrency, so four
  /// parallel one-second requests would report a quarter of the real rate. Using the whole window
  /// would charge idle time to the network, so a launch that fetches briefly and then sits idle
  /// would look slow. Measuring only the busy span leaves a value that moves when the connection
  /// changes and holds still when the app's fetch pattern does.
  ///
  /// This still can't see a stall between requests: if the radio dies while nothing is in flight,
  /// no interval covers it. `timedOut` is the signal for that case.
  public let throughputBytesPerSecond: Double?

  /// Shortest TCP handshake in the window, or `nil` if every connection was reused.
  ///
  /// A minimum rather than an average: a handshake that loses its SYN retries after a timeout of a
  /// second or more, so a mean over a few handshakes mostly reports retransmits. The fastest one
  /// approximates the true path latency.
  public let fastestTcpHandshake: TimeInterval?

  /// Convenience: returns `nil` when the summary is empty so callers can skip emitting fields.
  public var isEmpty: Bool {
    return count == 0
  }

  static let empty = NetworkRequestSummary(
    count: 0,
    failed: 0,
    timedOut: 0,
    bytesReceived: 0,
    bytesSent: 0,
    totalDuration: 0,
    slowestDuration: nil,
    slowestHost: nil,
    slowestTimeToFirstByte: nil,
    throughputBytesPerSecond: nil,
    fastestTcpHandshake: nil
  )

  /// Folds a sequence of `NetworkRequest` into a summary. The caller is responsible for filtering
  /// the sequence to the desired window.
  static func from(_ requests: [NetworkRequest]) -> NetworkRequestSummary {
    if requests.isEmpty {
      return .empty
    }
    var failed = 0
    var timedOut = 0
    var bytesReceived: Int64 = 0
    var bytesSent: Int64 = 0
    var totalDuration: TimeInterval = 0
    var slowest: NetworkRequest?
    var slowestTimeToFirstByte: TimeInterval?
    var fastestTcpHandshake: TimeInterval?

    for request in requests {
      if request.isFailed {
        failed += 1
      }
      if request.isTimeout {
        timedOut += 1
      }
      bytesReceived += request.responseBytesReceived ?? 0
      bytesSent += request.requestBytesSent ?? 0
      totalDuration += request.timings.totalDuration
      if let current = slowest {
        if request.timings.totalDuration > current.timings.totalDuration {
          slowest = request
        }
      } else {
        slowest = request
      }
      // Both folds skip requests that didn't report the phase, so a reused connection or a
      // header-less failure doesn't drag the result toward a value that was never measured.
      if let timeToFirstByte = request.timings.timeToFirstByte {
        slowestTimeToFirstByte = max(timeToFirstByte, slowestTimeToFirstByte ?? timeToFirstByte)
      }
      if let handshake = request.timings.tcpHandshakeDuration {
        fastestTcpHandshake = min(handshake, fastestTcpHandshake ?? handshake)
      }
    }

    return NetworkRequestSummary(
      count: requests.count,
      failed: failed,
      timedOut: timedOut,
      bytesReceived: bytesReceived,
      bytesSent: bytesSent,
      totalDuration: totalDuration,
      slowestDuration: slowest?.timings.totalDuration,
      slowestHost: slowest?.url.host,
      slowestTimeToFirstByte: slowestTimeToFirstByte,
      throughputBytesPerSecond: throughput(bytesReceived: bytesReceived, of: requests),
      fastestTcpHandshake: fastestTcpHandshake
    )
  }

  /// Received bytes over the time at least one request was in flight. Returns `nil` when nothing was
  /// received or no request reported a usable interval, so the caller can tell "unknown" from a
  /// genuinely slow connection.
  private static func throughput(bytesReceived: Int64, of requests: [NetworkRequest]) -> Double? {
    guard bytesReceived > 0 else {
      return nil
    }
    let busySeconds = busyDuration(of: requests)
    guard busySeconds > 0 else {
      return nil
    }
    return Double(bytesReceived) / busySeconds
  }

  /// Total length of the union of the requests' in-flight intervals, in seconds.
  ///
  /// Overlapping requests are merged so concurrency doesn't inflate the total, and gaps between
  /// requests are excluded so idle time isn't charged to the network. Requests missing either
  /// endpoint are skipped rather than treated as zero-length.
  private static func busyDuration(of requests: [NetworkRequest]) -> TimeInterval {
    let intervals = requests.compactMap { request -> (start: Date, end: Date)? in
      guard let start = request.timings.fetchStart, let end = request.timings.responseEnd else {
        return nil
      }
      return end >= start ? (start, end) : nil
    }
    .sorted { $0.start < $1.start }

    var total: TimeInterval = 0
    var spanStart: Date?
    var spanEnd: Date?
    for interval in intervals {
      guard let currentEnd = spanEnd, let currentStart = spanStart else {
        spanStart = interval.start
        spanEnd = interval.end
        continue
      }
      if interval.start <= currentEnd {
        // Overlaps (or touches) the open span, so extend it instead of counting the time twice.
        spanEnd = max(currentEnd, interval.end)
      } else {
        total += currentEnd.timeIntervalSince(currentStart)
        spanStart = interval.start
        spanEnd = interval.end
      }
    }
    if let spanStart, let spanEnd {
      total += spanEnd.timeIntervalSince(spanStart)
    }
    return total
  }
}

extension NetworkRequest {
  /// A request is treated as failed if it errored, or returned a 4xx (client error) or 5xx (server
  /// error) status. 1xx (informational), 2xx (success), and 3xx (redirection — usually followed
  /// transparently by URLSession, but the unfollowed case is still a successful response from the
  /// origin's perspective) are not failures. A missing status code (the request failed before
  /// headers arrived) counts as failed.
  var isFailed: Bool {
    if errorDescription != nil {
      return true
    }
    guard let statusCode else {
      return true
    }
    return statusCode >= 400
  }
}
