// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation

/// A thread that runs its run loop and gets work through `CFRunLoopPerformBlock` and
/// `CFRunLoopWakeUp`, like React Native's JavaScript thread.
final class RunLoopJavaScriptThread: @unchecked Sendable {
  let name: String
  private let lock = NSLock()
  private var runLoop: CFRunLoop?
  private let exited = DispatchSemaphore(value: 0)

  init(name: String) {
    self.name = name
    let ready = DispatchSemaphore(value: 0)
    let thread = Thread { [self] in
      // Without a source, the run loop would return at once instead of waiting for work.
      var context = CFRunLoopSourceContext()
      CFRunLoopAddSource(CFRunLoopGetCurrent(), CFRunLoopSourceCreate(nil, 0, &context), .defaultMode)
      lock.withLock {
        runLoop = CFRunLoopGetCurrent()
      }
      ready.signal()
      CFRunLoopRun()
      exited.signal()
    }
    thread.name = name
    thread.start()
    ready.wait()
  }

  func perform(_ block: @escaping @convention(block) () -> Void) {
    guard let runLoop = lock.withLock({ runLoop }) else {
      return
    }
    CFRunLoopPerformBlock(runLoop, CFRunLoopMode.commonModes.rawValue, block)
    CFRunLoopWakeUp(runLoop)
  }

  func run<R: Sendable>(_ operation: @escaping @Sendable () -> R) async -> R {
    return await withCheckedContinuation { continuation in
      perform {
        continuation.resume(returning: operation())
      }
    }
  }

  /// Stops the run loop, waits for the thread to exit and drops this object's reference to the run
  /// loop, like a JavaScript thread of a React instance that's gone.
  func stop() {
    guard let runLoop = lock.withLock({ runLoop }) else {
      return
    }
    CFRunLoopStop(runLoop)
    exited.wait()
    lock.withLock {
      self.runLoop = nil
    }
  }
}

/// A host scheduler that works like React's `RuntimeScheduler`: it runs tasks one at a time on the
/// JavaScript thread, and a task scheduled while another one runs waits until that one returns, even
/// when it waits in a nested run loop.
final class ReactLikeScheduler: @unchecked Sendable {
  let thread: RunLoopJavaScriptThread
  private let lock = NSLock()
  private var queue: [@convention(block) () -> Void] = []
  private var isLoopScheduled = false

  init(thread: RunLoopJavaScriptThread) {
    self.thread = thread
  }

  /// What the runtime gets as its opaque scheduler pointer. Retained and never released, like the
  /// handle React Native's host passes.
  var opaquePointer: UnsafeMutableRawPointer {
    return Unmanaged.passRetained(self).toOpaque()
  }

  func schedule(_ task: @escaping @convention(block) () -> Void) {
    let startsLoop = lock.withLock {
      queue.append(task)
      guard !isLoopScheduled else {
        return false
      }
      isLoopScheduled = true
      return true
    }
    if startsLoop {
      thread.perform { [self] in
        runTasks()
      }
    }
  }

  private func runTasks() {
    while true {
      let task = lock.withLock { () -> (@convention(block) () -> Void)? in
        guard let task = queue.first else {
          isLoopScheduled = false
          return nil
        }
        return task
      }
      guard let task else {
        return
      }
      task()
      // Like React's scheduler, the task leaves the queue only when it returns.
      lock.withLock {
        _ = queue.removeFirst()
      }
    }
  }
}

let scheduleOnReactLikeScheduler:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { schedulerPointer, _, callback in
    guard let schedulerPointer else {
      return
    }
    Unmanaged<ReactLikeScheduler>.fromOpaque(schedulerPointer).takeUnretainedValue().schedule(callback)
  }

/// A runtime on its own run-loop JavaScript thread, with a React-like host scheduler.
final class ReactLikeRuntime: @unchecked Sendable {
  let thread: RunLoopJavaScriptThread
  let scheduler: ReactLikeScheduler
  private(set) var owningRuntime: JavaScriptRuntime?
  private(set) var runtime: JavaScriptRuntime?

  init(name: String) async {
    let thread = RunLoopJavaScriptThread(name: name)
    let scheduler = ReactLikeScheduler(thread: thread)
    self.thread = thread
    self.scheduler = scheduler
    let runtimes = await thread.run {
      let owningRuntime = JavaScriptRuntime()
      let runtime = owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: scheduler.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnReactLikeScheduler, to: UnsafeRawPointer.self)
        )
      }
      return RuntimesBox(owningRuntime: owningRuntime, runtime: runtime)
    }
    owningRuntime = runtimes.owningRuntime
    runtime = runtimes.runtime
  }

  /// Releases the runtimes on the JavaScript thread.
  func release() async {
    let runtimes = RuntimesBox(owningRuntime: owningRuntime, runtime: runtime)
    owningRuntime = nil
    runtime = nil
    await thread.run {
      runtimes.runtime = nil
      runtimes.owningRuntime = nil
    }
  }
}

private final class RuntimesBox: @unchecked Sendable {
  var owningRuntime: JavaScriptRuntime?
  var runtime: JavaScriptRuntime?

  init(owningRuntime: JavaScriptRuntime?, runtime: JavaScriptRuntime?) {
    self.owningRuntime = owningRuntime
    self.runtime = runtime
  }
}

/// The name of the current thread. A function, because `Thread.current` isn't available in async code.
func currentThreadName() -> String? {
  return Thread.current.name
}
