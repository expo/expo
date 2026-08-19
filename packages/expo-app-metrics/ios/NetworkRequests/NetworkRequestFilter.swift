// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// Declares which requests a `NetworkRequestObserver` emits events for. Mirrors the JS
/// `NetworkRequestFilter` type.
///
/// Only attributes knowable the moment a request starts are supported (host and method), so the
/// same predicate yields the same answer at start and at completion. That keeps the
/// `requestStarted`/`requestCompleted` pair consistent: a request that matches always emits both, a
/// request that doesn't matches neither.
///
/// Different fields combine with AND; entries within a field combine with OR. A field that is left
/// unset places no constraint on its dimension, while a field set to an empty array allows nothing
/// through it (an empty allow-list matches no value), so any empty field drops every request. A
/// filter with no fields set matches every request, matching the no-filter default.
public struct NetworkRequestFilter: Record, Sendable {
  public init() {}

  @Field
  public var hosts: [String]?

  @Field
  public var methods: [String]?

  /// Returns whether a request with the given URL and method passes this filter. Host and method
  /// comparisons are case-insensitive. An unset (`nil`) field places no constraint on its
  /// dimension; a field set to an empty array allows nothing through it.
  public func matches(url: URL, method: String) -> Bool {
    if let hosts {
      let host = url.host?.lowercased()
      let allowed = hosts.contains { $0.lowercased() == host }
      if !allowed {
        return false
      }
    }
    if let methods {
      let requestMethod = method.uppercased()
      let allowed = methods.contains { $0.uppercased() == requestMethod }
      if !allowed {
        return false
      }
    }
    return true
  }
}
