/// Immutable wrapper that makes a non-Sendable value capturable by a `@Sendable` closure without compiler enforcement.
/// Unlike `NonisolatedUnsafeVar`, it is a struct, so wrapping a value doesn't allocate.
///
/// Use it instead of a `nonisolated(unsafe) let` local captured by such a closure: Swift 6.2 still reports
/// "sending '...' risks causing data races" for those, while a capture of a `Sendable` value passes on every version.
/// The caller is responsible for making sure the value is never accessed concurrently.
internal struct UncheckedSendable<Value>: @unchecked Sendable {
  let value: Value

  init(_ value: Value) {
    self.value = value
  }
}
