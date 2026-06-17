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
  public let totalDuration: TimeInterval

  /// Longest single request duration in the window, or `nil` if `count == 0`.
  public let slowestDuration: TimeInterval?

  /// Host of the slowest request, or `nil` if the request had no resolvable host.
  public let slowestHost: String?

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
    slowestDuration: nil,
    slowestHost: nil
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
    }

    return NetworkRequestSummary(
      count: requests.count,
      failed: failed,
      bytesReceived: bytesReceived,
      bytesSent: bytesSent,
      totalDuration: totalDuration,
      slowestDuration: slowest?.timings.totalDuration,
      slowestHost: slowest?.url.host
    )
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
