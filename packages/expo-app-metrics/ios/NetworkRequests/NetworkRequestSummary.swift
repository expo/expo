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

  /// Sum of `responseBytesReceived` across all requests in the window.
  public let bytesReceived: Int64

  /// Sum of `requestBytesSent` across all requests in the window.
  public let bytesSent: Int64

  /// Sum of `timings.totalDuration` across all requests. Can exceed wall-clock when requests overlap.
  ///
  /// Deliberately includes failures, unlike `slowest` and `throughputBytesPerSecond`, which describe
  /// only requests that completed. That makes it the one field that still accounts for time the app
  /// spent waiting on a request that never arrived: a window of timeouts reports the seconds they
  /// burned here even though nothing else measures them. The cost is that it can dwarf the other
  /// timings, since a single timeout contributes the client's whole timeout interval.
  public let totalDuration: TimeInterval

  /// The single longest-running request that completed, or `nil` when the window held none.
  ///
  /// Every field describes that one request, so they can be read together: a `duration` mostly made
  /// up of `timeToFirstByte` means the server was slow to answer, while a small `timeToFirstByte`
  /// against a large `bytesReceived` means the transfer itself was. `statusCode` explains a
  /// `bytesReceived` of 0, which is routine on a 304 and a problem on a 200.
  ///
  /// Failed requests are deliberately not candidates. A timeout's duration is the client's timeout
  /// setting rather than a measurement of the server, so letting one win would make these fields
  /// report a config constant that barely varies with the network. `failed` carries that signal
  /// instead.
  public let slowest: SlowestRequest?

  /// Facts about the slowest completed request in a window. See `NetworkRequestSummary.slowest`.
  public struct SlowestRequest: Sendable, Equatable {
    /// Host of the request, or `nil` if the URL had no resolvable host.
    public let host: String?

    /// Total wall-clock duration of the request.
    public let duration: TimeInterval

    /// Response status code. Never `nil` in practice, since a request that never received headers
    /// counts as failed and so isn't a candidate.
    ///
    /// Disambiguates an empty response: a `bytesReceived` of 0 means a cache revalidation on a 304,
    /// an intentionally bodyless reply on a 204, and a broken transfer on a 200.
    public let statusCode: Int?

    /// Time from the start of the fetch until the first response byte arrived, or `nil` if the
    /// request never reported one. Includes server processing time, so it's a proxy for network
    /// quality rather than a measurement of it — see `Timings.timeToFirstByte`.
    public let timeToFirstByte: TimeInterval?

    /// Response bytes received on the wire, or `nil` if the OS didn't report a count. Distinguishes
    /// a request that was slow because it moved a lot of data from one that was slow while idle.
    public let bytesReceived: Int64?
  }

  /// Received bytes over the time those bytes were actually moving, in bytes per second, or `nil`
  /// when nothing was received or no request reported a usable transfer window.
  ///
  /// The denominator is the union of the transfer windows of the requests that received bytes, each
  /// running from the first response byte to the last. Measuring from the first byte keeps DNS,
  /// connect and server think time out of the rate, and it excludes cache hits for free, since a
  /// response served from disk never reports one. Taking the union rather than a sum keeps
  /// concurrency from deflating it, and gaps between requests are left out so idle time isn't
  /// charged to the network. Failures are excluded: a request that stalled until the client gave up
  /// would otherwise hold the window open while nothing moved.
  ///
  /// Three things it can't see. A stall between requests, since no interval covers it; `failed` is
  /// the signal there. A long-lived trickle, such as an event stream, whose window stays open while
  /// almost nothing moves and drags down everything overlapping it. And eviction: when the ring
  /// buffer drops the earliest requests both sides shrink together, so read this as the rate of a
  /// sample of the window rather than all of it.
  public let throughputBytesPerSecond: Double?

  /// Convenience: returns `nil` when the summary is empty so callers can skip emitting fields.
  public var isEmpty: Bool {
    return count == 0
  }

  static let empty = NetworkRequestSummary(
    count: 0,
    failed: 0,
    bytesReceived: 0,
    bytesSent: 0,
    totalDuration: 0,
    slowest: nil,
    throughputBytesPerSecond: nil
  )

  /// Folds a sequence of `NetworkRequest` into a summary. The caller is responsible for filtering
  /// the sequence to the desired window.
  static func from(_ requests: [NetworkRequest]) -> NetworkRequestSummary {
    if requests.isEmpty {
      return .empty
    }
    var failed = 0
    var bytesReceived: Int64 = 0
    var bytesSent: Int64 = 0
    var totalDuration: TimeInterval = 0
    var slowest: NetworkRequest?

    for request in requests {
      if request.isFailed {
        failed += 1
      }
      // Clamped rather than `+=`: Swift traps on overflow, and this library must not be able to
      // abort a host app over an implausible byte count from the OS. A total pinned at the maximum
      // is visibly wrong; a crash in someone else's app is not recoverable.
      bytesReceived = bytesReceived.addingClamped(request.responseBytesReceived ?? 0)
      bytesSent = bytesSent.addingClamped(request.requestBytesSent ?? 0)
      totalDuration += request.timings.totalDuration
      // Only completed requests are candidates. A timeout's duration is the client's timeout
      // setting, not a measurement of the server, so letting one win would make these fields report
      // a config constant that barely varies with the network. Failures are already counted by
      // `failed`.
      if !request.isFailed {
        if let current = slowest {
          if request.timings.totalDuration > current.timings.totalDuration {
            slowest = request
          }
        } else {
          slowest = request
        }
      }
    }

    return NetworkRequestSummary(
      count: requests.count,
      failed: failed,
      bytesReceived: bytesReceived,
      bytesSent: bytesSent,
      totalDuration: totalDuration,
      slowest: slowest.map { request in
        SlowestRequest(
          host: request.url.host,
          duration: request.timings.totalDuration,
          statusCode: request.statusCode,
          timeToFirstByte: request.timings.timeToFirstByte,
          bytesReceived: request.responseBytesReceived
        )
      },
      throughputBytesPerSecond: throughput(of: requests)
    )
  }

  /// Received bytes over the time those bytes were moving. Returns `nil` when nothing was received
  /// or no receiving request reported a usable interval, so the caller can tell "unknown" from a
  /// genuinely slow connection.
  ///
  /// Both sides are computed from the same subset, so the numerator and denominator always describe
  /// the same traffic.
  private static func throughput(of requests: [NetworkRequest]) -> Double? {
    let measurable = measurableReceiving(in: requests)
    let bytes = measurable.reduce(Int64(0)) { $0.addingClamped($1.responseBytesReceived ?? 0) }
    guard bytes > 0 else {
      return nil
    }
    let busySeconds = busyDuration(of: measurable)
    guard busySeconds > 0 else {
      return nil
    }
    return Double(bytes) / busySeconds
  }

  /// The requests that completed, received bytes, and reported a measurable transfer window, which
  /// is the subset the throughput ratio is computed over. Deciding it once keeps the numerator and
  /// denominator describing the same traffic; filtering inside the busy-time fold instead would let
  /// a request contribute bytes while adding no time.
  private static func measurableReceiving(in requests: [NetworkRequest]) -> [NetworkRequest] {
    return requests.filter { request in
      guard !request.isFailed else {
        return false
      }
      guard (request.responseBytesReceived ?? 0) > 0 else {
        return false
      }
      guard let start = request.timings.responseStart,
        let end = request.timings.measuredResponseEnd
      else {
        return false
      }
      return end.timeIntervalSince(start) >= minimumTransferWindow
    }
  }

  /// Shortest transfer window this ratio will divide by, in seconds.
  ///
  /// Matches Android, where `Date()` advances in whole milliseconds and a faster transfer records
  /// as a zero-length window. iOS could resolve those from the transaction metrics, but keeping
  /// them would make the platforms disagree on whether the key is present at all, and would leave
  /// Android's sample skewed slow. Dividing bytes by a duration the clock can't resolve says more
  /// about the timer than the network.
  private static let minimumTransferWindow: TimeInterval = 0.001

  /// Total length of the union of the requests' transfer windows, in seconds, each running from the
  /// first response byte to the last.
  ///
  /// Overlapping requests are merged so concurrency doesn't inflate the total, and gaps between
  /// requests are excluded so idle time isn't charged to the network. Requests without a measurable
  /// window are skipped; callers computing a rate should pass a list already narrowed by
  /// `measurableReceiving(in:)` so the same requests feed both sides of the ratio.
  private static func busyDuration(of requests: [NetworkRequest]) -> TimeInterval {
    let intervals = requests.compactMap { request -> (start: Date, end: Date)? in
      guard let start = request.timings.responseStart,
        let end = request.timings.measuredResponseEnd
      else {
        return nil
      }
      return end.timeIntervalSince(start) >= minimumTransferWindow ? (start, end) : nil
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

extension Int64 {
  /// Adds `other`, pinning at `Int64.max` instead of trapping.
  ///
  /// Byte counts come from the OS, and an observability library has no business aborting its host
  /// app over one that doesn't make sense. Both operands are non-negative here, so only the upper
  /// bound is reachable.
  fileprivate func addingClamped(_ other: Int64) -> Int64 {
    let (sum, overflowed) = addingReportingOverflow(other)
    return overflowed ? Int64.max : sum
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
