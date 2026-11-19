import Foundation

/// A backport of `Mutex` from the Synchronization framework (iOS 18+).
/// Protects mutable state with a lock, providing a safe `withLock` API
/// identical to the one in the standard library.
@available(iOS, deprecated: 18.0, message: "Use Mutex from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use Mutex from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use Mutex from the Synchronization framework")
public final class Mutex<Value>: @unchecked Sendable {
  private var _value: Value

  // An `os_unfair_lock` must not move in memory, so it lives in its own allocation. Under contention it
  // costs much less than `NSLock`, which waits in the kernel.
  private let _lock: os_unfair_lock_t = {
    let lock = os_unfair_lock_t.allocate(capacity: 1)
    lock.initialize(to: os_unfair_lock())
    return lock
  }()

  public init(_ initialValue: Value) {
    _value = initialValue
  }

  deinit {
    _lock.deinitialize(count: 1)
    _lock.deallocate()
  }

  @discardableResult
  public func withLock<T>(_ body: (inout Value) throws -> T) rethrows -> T {
    os_unfair_lock_lock(_lock)
    defer { os_unfair_lock_unlock(_lock) }
    return try body(&_value)
  }
}
