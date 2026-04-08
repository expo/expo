import Foundation

/// A backport of `Mutex` from the Synchronization framework (iOS 18+).
/// Protects mutable state with a lock, providing a safe `withLock` API
/// identical to the one in the standard library.
@available(iOS, deprecated: 18.0, message: "Use Mutex from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use Mutex from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use Mutex from the Synchronization framework")
public final class Mutex<Value>: @unchecked Sendable {
  private var _value: Value
  private let _lock = NSLock()

  public init(_ initialValue: Value) {
    _value = initialValue
  }

  @discardableResult
  public func withLock<T>(_ body: (inout Value) throws -> T) rethrows -> T {
    _lock.lock()
    defer { _lock.unlock() }
    return try body(&_value)
  }
}
