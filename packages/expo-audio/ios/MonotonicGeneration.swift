import Foundation

/**
 A lock-guarded, monotonically increasing counter for detecting superseded
 deferred work: capture `current` when enqueueing an operation, `bump()` in
 every path that invalidates it, and compare captured vs. `current` before
 executing. Shared by the module-level session activation token (a later
 activation supersedes a pending deactivation) and the per-playable play
 generation (pause/replace/teardown supersede a play still queued behind a
 slow session activation).
 */
final class MonotonicGeneration {
  private let lock = NSLock()
  private var value = 0

  var current: Int {
    lock.lock()
    defer {
      lock.unlock()
    }
    return value
  }

  @discardableResult
  func bump() -> Int {
    lock.lock()
    defer {
      lock.unlock()
    }
    value += 1
    return value
  }
}
