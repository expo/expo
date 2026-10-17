// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
import Foundation
import os

extension JavaScriptRuntime {
  /// Runs work on the runtime's JavaScript thread. The only implementation of `schedule`,
  /// `runOrSchedule` and `execute`: ``JavaScriptRuntime`` forwards to it.
  ///
  /// Without a host scheduler (``supportsAsyncScheduling`` is `false`), work runs on the calling
  /// thread.
  internal final class Scheduler: @unchecked Sendable {
    private let pointee: expo.RuntimeScheduler

    /// Captured at construction time, which runs on the JavaScript thread.
    private let jsThreadID: UInt64 = {
      var id: UInt64 = 0
      pthread_threadid_np(nil, &id)
      return id
    }()

    internal init(_ pointee: expo.RuntimeScheduler) {
      self.pointee = pointee
    }

    internal var supportsAsyncScheduling: Bool {
      return pointee.supportsAsyncScheduling()
    }

    @inline(__always)
    internal func isOnJavaScriptThread() -> Bool {
      var current: UInt64 = 0
      pthread_threadid_np(nil, &current)
      return current == jsThreadID
    }

    // The hot functions are `@inline(__always)`, so forwarding from the runtime adds no call level.

    @inline(__always)
    internal func schedule(
      priority: JavaScriptRuntime.SchedulerPriority = .normal,
      _ closure: @escaping @JavaScriptActor () -> sending Void
    ) {
      let cxxPriority = expo.RuntimeScheduler.Priority(rawValue: priority.rawValue) ?? .NormalPriority
      pointee.scheduleTask(cxxPriority) {
        JavaScriptActor.assumeIsolated(closure)
      }
    }

    internal func schedule(
      priority: JavaScriptRuntime.SchedulerPriority = .normal,
      _ closure: @escaping @JavaScriptActor () async throws -> Void
    ) {
      schedule(priority: priority) { () -> Void in
        Task.immediate_polyfill {
          try await closure()
        }
      }
    }

    @inline(__always)
    internal func runOrSchedule(
      priority: JavaScriptRuntime.SchedulerPriority = .normal,
      _ closure: @escaping @JavaScriptActor () -> Void
    ) {
      if isOnJavaScriptThread() {
        JavaScriptActor.assumeIsolated(closure)
      } else {
        schedule(priority: priority, closure)
      }
    }

    @available(*, noasync)
    @inline(__always)
    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () throws -> R) throws -> sending R {
      if isOnJavaScriptThread() {
        return try JavaScriptActor.assumeIsolated(closure)
      }

      var result: Result<R, any Error>!
      let waiter = ThreadWaiter()

      pointee.scheduleTask(.ImmediatePriority) {
        do {
          result = .success(try JavaScriptActor.assumeIsolated(closure))
        } catch {
          result = .failure(error)
        }
        waiter.wake()
      }

      waiter.wait(until: {
        result != nil
      })
      return try result.get()
    }

    @inline(__always)
    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () throws -> R) async throws -> sending R {
      if isOnJavaScriptThread() {
        return try JavaScriptActor.assumeIsolated(closure)
      }
      return try await withUnsafeThrowingContinuation { continuation in
        pointee.scheduleTask(.ImmediatePriority) {
          do {
            continuation.resume(returning: try JavaScriptActor.assumeIsolated(closure))
          } catch {
            continuation.resume(throwing: error)
          }
        }
      }
    }

    @available(*, noasync)
    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () async throws -> R) throws -> sending R {
      let result = NonisolatedUnsafeVar<Result<R, any Error>>()
      let runInline = isOnJavaScriptThread()
      let waiter = ThreadWaiter()

      func body() {
        Task.immediate_polyfill(priority: .high) {
          do {
            result.value = .success(try await closure())
          } catch {
            result.value = .failure(error)
          }
          waiter.wake()
        }
      }
      if runInline {
        body()
      } else {
        pointee.scheduleTask(.ImmediatePriority, body)
      }

      waiter.wait(until: {
        result.value != nil
      })
      return try result.value.get()
    }

    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () async throws -> R) async throws
      -> sending R
    {
      if isOnJavaScriptThread() {
        return try await Task.immediate_polyfill(priority: .high, operation: closure).value
      }
      return try await withUnsafeThrowingContinuation { continuation in
        pointee.scheduleTask(.ImmediatePriority) {
          Task.immediate_polyfill(priority: .high) { @JavaScriptActor in
            do {
              continuation.resume(returning: try await closure())
            } catch {
              continuation.resume(throwing: error)
            }
          }
        }
      }
    }
  }
}

/// Blocks the thread that creates it in ``wait(until:)`` until another thread calls ``wake()``.
private final class ThreadWaiter: @unchecked Sendable {
  private enum Sleep {
    case runLoop(CFRunLoop, CFRunLoopSource, CFRunLoopMode)
    case semaphore(DispatchSemaphore)
  }

  private static let spinNanoseconds: UInt64 = 20_000

  private let isWoken = OSAllocatedUnfairLock(initialState: false)
  private let sleep: Sleep

  init() {
    // A thread inside its run loop, such as the main thread or the JavaScript thread, keeps running
    // it during the wait, in the same mode: the work the caller waits for may be delivered through
    // it. A source signaled by `wake()` makes the run loop return when the task is done. Other
    // threads, such as dispatch workers, have nothing to run, so they wait on a semaphore.
    let runLoop: CFRunLoop = CFRunLoopGetCurrent()
    guard let mode = CFRunLoopCopyCurrentMode(runLoop) else {
      sleep = .semaphore(DispatchSemaphore(value: 0))
      return
    }
    var context = CFRunLoopSourceContext()
    context.perform = { _ in }
    let source: CFRunLoopSource = CFRunLoopSourceCreate(nil, 0, &context)
    CFRunLoopAddSource(runLoop, source, mode)
    sleep = .runLoop(runLoop, source, mode)
  }

  func wake() {
    isWoken.withLock { isWoken in
      isWoken = true
    }
    switch sleep {
    case .runLoop(let runLoop, let source, _):
      CFRunLoopSourceSignal(source)
      CFRunLoopWakeUp(runLoop)
    case .semaphore(let semaphore):
      // Makes a system call only when the caller already sleeps in `wait`.
      semaphore.signal()
    }
  }

  func wait(until isFinished: () -> Bool) {
    let spinDeadline = clock_gettime_nsec_np(CLOCK_UPTIME_RAW) + Self.spinNanoseconds
    while !isWoken.withLock({ $0 }) && clock_gettime_nsec_np(CLOCK_UPTIME_RAW) < spinDeadline {
      // Spins on purpose: short tasks finish within a few microseconds, sooner than a sleeping
      // thread wakes up. After the deadline, the thread sleeps below.
    }
    switch sleep {
    case .runLoop(_, let source, let mode):
      defer {
        // Also removes the source from the run loop. A later `wake()` does nothing.
        CFRunLoopSourceInvalidate(source)
      }
      // The timeout is a backstop for a missed wake-up.
      while !isFinished() {
        CFRunLoopRunInMode(mode, 0.1, true)
      }
    case .semaphore(let semaphore):
      if !isFinished() {
        semaphore.wait()
      }
    }
  }
}
