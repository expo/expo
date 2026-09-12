// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Which network requests get recorded as spans. Unlike the dispatch-side gates, a request
/// rejected here never reaches disk.
///
/// Persisted, so requests observed before JS configures anything follow the last-applied setting.
internal struct NetworkTracesConfiguration: Codable, Sendable {
  var enabled: Bool = true

  /// Allowed hosts, compared for exact, case-insensitive equality. `nil` allows every host;
  /// an empty array allows none.
  var hosts: [String]?

  /// Allowed HTTP methods, compared case-insensitively. `nil` allows every method.
  var methods: [String]?

  /// Whether a request should be recorded. Matching is delegated to `NetworkRequestFilter`, so the
  /// capture gate and the JS-facing observer can't drift apart.
  func allows(url: URL, method: String) -> Bool {
    guard enabled else {
      return false
    }
    return NetworkRequestFilter(hosts: hosts, methods: methods).matches(url: url, method: method)
  }
}
