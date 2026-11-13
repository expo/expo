// Copyright 2025-present 650 Industries. All rights reserved.

/// A value that can be set once. Reads before the set return the initial value and do not block
/// the set.
final class WriteOnce<Value: Sendable>: Sendable {
  private let state: Mutex<(value: Value, isSet: Bool)>

  init(_ initialValue: Value) {
    state = Mutex((initialValue, false))
  }

  var value: Value {
    return state.withLock { $0.value }
  }

  /// Returns `false`, and keeps the current value, when the value was already set.
  func set(_ value: Value) -> Bool {
    return state.withLock { state in
      guard !state.isSet else {
        return false
      }
      state = (value, true)
      return true
    }
  }
}
