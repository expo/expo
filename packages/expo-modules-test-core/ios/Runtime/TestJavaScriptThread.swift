// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// A thread that runs the operations scheduled on it one at a time, in order. A serial dispatch queue
/// is not enough: it may use a different worker thread for each operation, while a
/// `JavaScriptRuntime` treats the thread it was created on as its JavaScript thread.
internal final class TestJavaScriptThread: @unchecked Sendable {
  private let condition = NSCondition()
  private var operations: [@convention(block) () -> Void] = []
  private var isStopping = false
  private var threadID: UInt64 = 0

  init() {
    let started = DispatchSemaphore(value: 0)
    let thread = Thread { [self] in
      pthread_threadid_np(nil, &threadID)
      started.signal()
      runOperations()
    }
    thread.name = "expo.modules.tests.runtime"
    thread.start()
    started.wait()
  }

  var isCurrent: Bool {
    var current: UInt64 = 0
    pthread_threadid_np(nil, &current)
    return current == threadID
  }

  func schedule(_ operation: @escaping @convention(block) () -> Void) {
    condition.lock()
    operations.append(operation)
    condition.signal()
    condition.unlock()
  }

  /// Runs the operation on this thread and blocks the calling thread until it returns. Runs it inline
  /// when already on this thread.
  func runAndWait(_ operation: () -> Void) {
    if isCurrent {
      operation()
      return
    }
    withoutActuallyEscaping(operation) { operation in
      let finished = DispatchSemaphore(value: 0)
      nonisolated(unsafe) var operation: Optional<() -> Void> = operation
      schedule {
        operation?()
        operation = nil
        finished.signal()
      }
      finished.wait()
    }
  }

  /// Makes the thread exit once it runs out of scheduled operations.
  func stopWhenIdle() {
    condition.lock()
    isStopping = true
    condition.signal()
    condition.unlock()
  }

  private func runOperations() {
    while true {
      condition.lock()
      while operations.isEmpty && !isStopping {
        condition.wait()
      }
      if operations.isEmpty {
        condition.unlock()
        return
      }
      let operation = operations.removeFirst()
      condition.unlock()

      operation()
    }
  }
}
