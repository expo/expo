// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
import Foundation
import os

extension JavaScriptRuntime {
  /// Runs work on the runtime's JavaScript thread. The only implementation of `schedule`,
  /// `runOrSchedule` and `execute`: ``JavaScriptRuntime`` forwards to it, and promises and callbacks
  /// hold it instead of the runtime.
  ///
  /// Safe to use from any thread, also after the runtime is gone. It reads the runtime only on the
  /// JavaScript thread, where the runtime's `deinit` runs too. When the runtime is gone, work is
  /// dropped and `execute` throws ``JavaScriptCallback/RuntimeLostError``. `execute` also throws it
  /// when the host drops the task without running it.
  ///
  /// Without a host scheduler (``supportsAsyncScheduling`` is `false`), work runs on the calling
  /// thread, so the caller must not race the runtime's `deinit`.
  internal final class Scheduler: @unchecked Sendable {
    private let pointee: expo.RuntimeScheduler
    private let handle: JavaScriptRuntimeHandle

    /// Releases that `scheduleRelease` collected on the JavaScript thread and that no task runs yet.
    private let pendingReleases = OSAllocatedUnfairLock<[@JavaScriptActor (JavaScriptRuntime) -> Void]>(
      uncheckedState: []
    )

    /// Captured at construction time, which runs on the JavaScript thread.
    private let jsThreadID: UInt64 = {
      var id: UInt64 = 0
      pthread_threadid_np(nil, &id)
      return id
    }()

    internal init(_ pointee: expo.RuntimeScheduler, handle: JavaScriptRuntimeHandle) {
      self.pointee = pointee
      self.handle = handle
    }

    /// Whether the runtime may still be alive. Safe from any thread: `false` is final, `true` may be stale.
    @inline(__always)
    internal var mayBeAlive: Bool {
      return pointee.isRuntimeAlive()
    }

    /// Called from the runtime's `deinit`.
    internal func markRuntimeGone() {
      pointee.markRuntimeGone()
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

    // MARK: - Closures without the runtime

    // The hot functions are `@inline(__always)`: one more call level measured about 10 ns more for
    // each promise or callback release.

    @inline(__always)
    internal func schedule(
      priority: JavaScriptRuntime.SchedulerPriority = .normal,
      _ closure: @escaping @JavaScriptActor () -> sending Void
    ) {
      let cxxPriority = expo.RuntimeScheduler.Priority(rawValue: priority.rawValue) ?? .NormalPriority
      pointee.scheduleTask(cxxPriority) { [handle] in
        JavaScriptActor.assumeIsolated {
          guard handle.isAlive else {
            return
          }
          closure()
        }
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
        JavaScriptActor.assumeIsolated {
          guard handle.isAlive else {
            return
          }
          closure()
        }
      } else {
        schedule(priority: priority, closure)
      }
    }

    @available(*, noasync)
    @inline(__always)
    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () throws -> R) throws -> sending R {
      if isOnJavaScriptThread() {
        return try JavaScriptActor.assumeIsolated {
          try checkAlive()
          return try closure()
        }
      }
      guard mayBeAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      let result = NonisolatedUnsafeVar<Result<R, any Error>>()
      let waiter = ThreadWaiter()
      pointee.scheduleTask(.ImmediatePriority) { [completion = BlockingCompletion(result, waiter)] in
        completion.finish(
          Result {
            try JavaScriptActor.assumeIsolated {
              try self.checkAlive()
              return try closure()
            }
          }
        )
      }
      waiter.wait(until: {
        result.value != nil
      })
      return try result.value.get()
    }

    @inline(__always)
    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () throws -> R) async throws -> sending R {
      if isOnJavaScriptThread() {
        return try JavaScriptActor.assumeIsolated {
          try checkAlive()
          return try closure()
        }
      }
      guard mayBeAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      return try await withUnsafeThrowingContinuation { continuation in
        pointee.scheduleTask(.ImmediatePriority) { [completion = ContinuationCompletion(continuation)] in
          completion.finish(
            Result {
              try JavaScriptActor.assumeIsolated {
                try self.checkAlive()
                return try closure()
              }
            }
          )
        }
      }
    }

    // The tasks below start isolated to `JavaScriptActor`, which saves an executor hop.

    @available(*, noasync)
    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () async throws -> R) throws -> sending R {
      guard mayBeAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      let result = NonisolatedUnsafeVar<Result<R, any Error>>()
      let runInline = isOnJavaScriptThread()
      let waiter = ThreadWaiter()

      func run(_ completion: BlockingCompletion<R>) {
        Task.immediate_polyfill(priority: .high) { @JavaScriptActor in
          do {
            try self.checkAlive()
            completion.finish(.success(try await closure()))
          } catch {
            completion.finish(.failure(error))
          }
        }
      }
      if runInline {
        run(BlockingCompletion(result, waiter))
      } else {
        pointee.scheduleTask(.ImmediatePriority) { [completion = BlockingCompletion(result, waiter)] in
          run(completion)
        }
      }
      waiter.wait(until: {
        result.value != nil
      })
      return try result.value.get()
    }

    internal func execute<R: Sendable>(_ closure: @escaping @JavaScriptActor () async throws -> R) async throws
      -> sending R
    {
      guard mayBeAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      if isOnJavaScriptThread() {
        try JavaScriptActor.assumeIsolated { try checkAlive() }
        return try await Task.immediate_polyfill(priority: .high, operation: closure).value
      }
      return try await withUnsafeThrowingContinuation { continuation in
        pointee.scheduleTask(.ImmediatePriority) { [completion = ContinuationCompletion(continuation)] in
          Task.immediate_polyfill(priority: .high) { @JavaScriptActor in
            do {
              try self.checkAlive()
              completion.finish(.success(try await closure()))
            } catch {
              completion.finish(.failure(error))
            }
          }
        }
      }
    }

    // MARK: - Closures that take the runtime

    // For code that runs off the JavaScript thread without holding the runtime, like promises and
    // callbacks. The runtime is read on the JavaScript thread and passed to the closure.

    /// The queue that `scheduleRelease` schedules from when it runs on the JavaScript thread. It is
    /// serial, so at most one thread waits for React Native's scheduler mutex.
    private static let releaseQueue = DispatchQueue(label: "expo.modules.jsi.release", qos: .utility)

    /// Schedules the release of a value's state from its `deinit`. On the JavaScript thread, it must not
    /// schedule directly: React Native's scheduler destroys its queued tasks while it holds the mutex
    /// that scheduling takes, when a JavaScript error clears the queues, so a value dropped with a task
    /// would deadlock the JavaScript thread. So it adds the release to a batch, and the release queue
    /// schedules one task for the batch. The batch is taken before its task is scheduled, so each
    /// release runs after a resolve or call that was queued before its value was dropped.
    internal func scheduleRelease(_ body: @escaping @JavaScriptActor (JavaScriptRuntime) -> Void) {
      guard supportsAsyncScheduling && isOnJavaScriptThread() else {
        schedule(body)
        return
      }
      // `withLockUnchecked`, because the closures are not `Sendable`.
      let startsBatch = pendingReleases.withLockUnchecked { pendingReleases in
        pendingReleases.append(body)
        return pendingReleases.count == 1
      }
      guard startsBatch else {
        return
      }
      Self.releaseQueue.async {
        let batch = self.pendingReleases.withLockUnchecked { pendingReleases in
          defer { pendingReleases.removeAll() }
          return pendingReleases
        }
        self.schedule { runtime in
          for release in batch {
            release(runtime)
          }
        }
      }
    }

    @inline(__always)
    internal func schedule(
      priority: JavaScriptRuntime.SchedulerPriority = .normal,
      _ body: @escaping @JavaScriptActor (JavaScriptRuntime) -> Void
    ) {
      let cxxPriority = expo.RuntimeScheduler.Priority(rawValue: priority.rawValue) ?? .NormalPriority
      pointee.scheduleTask(cxxPriority) { [handle] in
        JavaScriptActor.assumeIsolated {
          guard let runtime = handle.runtime else {
            return
          }
          body(runtime)
        }
      }
    }

    @inline(__always)
    internal func runOrSchedule(
      priority: JavaScriptRuntime.SchedulerPriority = .normal,
      _ body: @escaping @JavaScriptActor (JavaScriptRuntime) -> Void
    ) {
      if isOnJavaScriptThread() {
        JavaScriptActor.assumeIsolated {
          guard let runtime = handle.runtime else {
            return
          }
          body(runtime)
        }
      } else {
        schedule(priority: priority, body)
      }
    }

    @available(*, noasync)
    @inline(__always)
    internal func execute<R: Sendable>(_ body: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> R) throws
      -> sending R
    {
      if isOnJavaScriptThread() {
        return try JavaScriptActor.assumeIsolated {
          return try body(try liveRuntime())
        }
      }
      guard mayBeAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      let result = NonisolatedUnsafeVar<Result<R, any Error>>()
      let waiter = ThreadWaiter()
      pointee.scheduleTask(.ImmediatePriority) { [completion = BlockingCompletion(result, waiter)] in
        completion.finish(Result { try JavaScriptActor.assumeIsolated { try body(try self.liveRuntime()) } })
      }
      waiter.wait(until: {
        result.value != nil
      })
      return try result.value.get()
    }

    @inline(__always)
    internal func execute<R: Sendable>(_ body: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> R) async throws
      -> sending R
    {
      if isOnJavaScriptThread() {
        return try JavaScriptActor.assumeIsolated {
          return try body(try liveRuntime())
        }
      }
      guard mayBeAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      return try await withUnsafeThrowingContinuation { continuation in
        pointee.scheduleTask(.ImmediatePriority) { [completion = ContinuationCompletion(continuation)] in
          completion.finish(Result { try JavaScriptActor.assumeIsolated { try body(try self.liveRuntime()) } })
        }
      }
    }

    /// The runtime, not retained, when called on the JavaScript thread, or `nil` on any other thread.
    /// Throws ``JavaScriptCallback/RuntimeLostError`` on the JavaScript thread once the runtime is
    /// gone. The runtime stays alive while the JavaScript thread runs the caller.
    @inline(__always)
    internal func unretainedLiveRuntimeIfOnJavaScriptThread() throws -> Unmanaged<JavaScriptRuntime>? {
      guard isOnJavaScriptThread() else {
        return nil
      }
      guard let runtime = handle.unretainedRuntime else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      return runtime
    }

    // MARK: - Liveness on the JavaScript thread

    @JavaScriptActor
    @inline(__always)
    private func checkAlive() throws {
      guard handle.isAlive else {
        throw JavaScriptCallback.RuntimeLostError()
      }
    }

    @JavaScriptActor
    @inline(__always)
    private func liveRuntime() throws -> JavaScriptRuntime {
      guard let runtime = handle.runtime else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      return runtime
    }
  }
}

/// Delivers the result of a scheduled `execute` call to a thread that waits for it. Only the task
/// holds it, so when the host releases the task without running it (for example, because the React
/// scheduler is gone), `deinit` delivers ``JavaScriptCallback/RuntimeLostError`` and the caller does
/// not wait forever.
private final class BlockingCompletion<R: Sendable>: @unchecked Sendable {
  private let result: NonisolatedUnsafeVar<Result<R, any Error>>
  private let waiter: ThreadWaiter
  private var isFinished = false

  init(_ result: NonisolatedUnsafeVar<Result<R, any Error>>, _ waiter: ThreadWaiter) {
    self.result = result
    self.waiter = waiter
  }

  func finish(_ value: Result<R, any Error>) {
    isFinished = true
    result.value = value
    waiter.wake()
  }

  deinit {
    if !isFinished {
      finish(.failure(JavaScriptCallback.RuntimeLostError()))
    }
  }
}

/// Like ``BlockingCompletion``, for a caller that awaits the result.
private final class ContinuationCompletion<R: Sendable>: @unchecked Sendable {
  private var continuation: UnsafeContinuation<R, any Error>?

  init(_ continuation: UnsafeContinuation<R, any Error>) {
    self.continuation = continuation
  }

  func finish(_ value: sending Result<R, any Error>) {
    continuation?.resume(with: value)
    continuation = nil
  }

  deinit {
    continuation?.resume(throwing: JavaScriptCallback.RuntimeLostError())
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
