// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// A thread that runs the operations scheduled on it one at a time, in order, through its run loop,
/// like React Native's JavaScript thread. A serial dispatch queue is not enough: it may use a
/// different worker thread for each operation, while a `JavaScriptRuntime` treats the thread it was
/// created on as its JavaScript thread. And `JavaScriptActor` sends its jobs through the run loop of
/// the bound runtime's thread.
internal final class TestJavaScriptThread: @unchecked Sendable {
  private let lock = NSLock()
  private var runLoop: CFRunLoop?
  private var threadID: UInt64 = 0
  private var isStopped = false
  /// Operations scheduled after the thread stopped. Kept, never released, like work left in the queue
  /// of a thread that never runs again: releasing it could destroy JSI values after their runtime is
  /// gone.
  private var abandoned: [@convention(block) () -> Void] = []

  init() {
    let started = DispatchSemaphore(value: 0)
    let thread = Thread { [self] in
      pthread_threadid_np(nil, &threadID)
      // Without a source, the run loop would return at once instead of waiting for work.
      var context = CFRunLoopSourceContext()
      CFRunLoopAddSource(CFRunLoopGetCurrent(), CFRunLoopSourceCreate(nil, 0, &context), .defaultMode)
      runLoop = CFRunLoopGetCurrent()
      started.signal()
      CFRunLoopRun()
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
    lock.lock()
    guard !isStopped, let runLoop else {
      abandoned.append(operation)
      lock.unlock()
      return
    }
    lock.unlock()
    CFRunLoopPerformBlock(runLoop, CFRunLoopMode.commonModes.rawValue, operation)
    CFRunLoopWakeUp(runLoop)
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
      nonisolated(unsafe) var operation: (() -> Void)? = operation
      schedule {
        operation?()
        operation = nil
        finished.signal()
      }
      finished.wait()
    }
  }

  /// Makes the thread exit once it runs the operations scheduled so far. Operations scheduled later
  /// never run.
  func stopWhenIdle() {
    schedule { [self] in
      lock.lock()
      isStopped = true
      lock.unlock()
      CFRunLoopStop(CFRunLoopGetCurrent())
    }
  }
}
