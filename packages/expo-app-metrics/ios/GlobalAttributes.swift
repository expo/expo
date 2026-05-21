// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Holds caller-provided global attributes that are merged into every subsequent
 metric's `params` and log record's `attributes`. Values live for the
 lifetime of the SDK instance and are cleared on app restart — persistent
 storage is intentionally out of scope.

 The store is guarded by a `Mutex` so it can be read from the JS thread,
 the `AppMetricsActor`-driven persistence path, and the SDK's metric
 producers without contention.
 */
public enum GlobalAttributes {
  private static let store = Mutex<[String: Any]>([:])

  /**
   Replaces the current set of global attributes. The input is sanitized using
   the same rules as per-event attributes (`expo.*` reserved, empty keys
   rejected, per-record cap).

   Passing an empty map or `nil` clears the store.
   */
  public static func set(_ attributes: [String: Any]?) {
    let sanitized = sanitizeLogEventAttributes(attributes)
    store.withLock { state in
      state = sanitized.attributes ?? [:]
    }
  }

  /**
   Returns the current global attributes merged with the given per-event
   attributes. Per-event keys win on collision so callers can override a
   global value for a single record without mutating the store.
   */
  static func merged(with eventAttributes: [String: Any]?) -> [String: Any]? {
    return store.withLock { state in
      if state.isEmpty {
        return eventAttributes
      }
      guard let eventAttributes, !eventAttributes.isEmpty else {
        return state
      }
      return state.merging(eventAttributes) { _, perEvent in
        return perEvent
      }
    }
  }
}
