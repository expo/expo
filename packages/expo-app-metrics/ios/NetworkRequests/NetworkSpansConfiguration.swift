// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Capture-time recording policy for network request spans: whether completed requests are
/// written to the `spans` table at all, plus an optional host/method allowlist. Consulted by
/// `NetworkRequestPersistence` before each insert — a request rejected here never reaches disk,
/// unlike the dispatch-side gates (`dispatchingEnabled`, sampling) which only suppress the
/// upload of rows that were already persisted.
///
/// Persisted in `AppMetricsUserDefaults` so requests observed before JS configuration runs
/// (early startup, or the next launch) follow the last-applied setting.
internal struct NetworkSpansConfiguration: Codable, Sendable {
  var enabled: Bool = true

  /// Allowed hosts, compared for exact, case-insensitive equality. `nil` allows every host;
  /// an empty array allows none.
  var hosts: [String]?

  /// Allowed HTTP methods, compared case-insensitively. `nil` allows every method.
  var methods: [String]?

  /// Whether a request with the given URL and method should be recorded. Mirrors the
  /// `NetworkRequestFilter.matches` semantics used by the JS-facing observer.
  func allows(url: URL, method: String) -> Bool {
    if !enabled {
      return false
    }
    if let hosts {
      let host = url.host?.lowercased()
      let allowed = hosts.contains { allowedHost in
        return allowedHost.lowercased() == host
      }
      if !allowed {
        return false
      }
    }
    if let methods {
      let requestMethod = method.uppercased()
      let allowed = methods.contains { allowedMethod in
        return allowedMethod.uppercased() == requestMethod
      }
      if !allowed {
        return false
      }
    }
    return true
  }
}
