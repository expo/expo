import Foundation

/// A backport of `Mutex` from the Synchronization framework (iOS 18+).
/// Protects mutable state with a lock, providing a safe `withLock` API
/// identical to the one in the standard library.
@available(iOS, deprecated: 18.0, message: "Use Mutex from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use Mutex from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use Mutex from the Synchronization framework")
@frozen
public struct Mutex<Value>: ~Copyable, @unchecked Sendable {
  // An `os_unfair_lock` must not move in memory. The buffer object keeps it after the value, so the lock and the
  // value take one allocation, as in `OSAllocatedUnfairLock`. Under contention it costs much less than `NSLock`,
  // which waits in the kernel.
  private let buffer: ManagedBuffer<Value, os_unfair_lock>

  public init(_ initialValue: Value) {
    buffer = ManagedBuffer<Value, os_unfair_lock>.create(minimumCapacity: 1) { buffer in
      buffer.withUnsafeMutablePointerToElements { $0.initialize(to: os_unfair_lock()) }
      return initialValue
    }
  }

  @discardableResult
  public borrowing func withLock<T>(_ body: (inout Value) throws -> T) rethrows -> T {
    return try buffer.withUnsafeMutablePointers { value, lock in
      os_unfair_lock_lock(lock)
      defer { os_unfair_lock_unlock(lock) }
      return try body(&value.pointee)
    }
  }
}
