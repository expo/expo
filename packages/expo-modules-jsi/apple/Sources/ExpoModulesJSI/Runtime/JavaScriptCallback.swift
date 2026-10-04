// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
internal import ExpoModulesJSI_Cxx

/// A JavaScript function that native code can keep and call later, from any thread.
///
/// Bindings generated for a `@JS` function create one for each closure argument and wrap it in a
/// native closure of the declared type. Each call hops to the JavaScript thread, encodes the
/// arguments there, calls the function and decodes its result. When the callback is released, the
/// function is released on the JavaScript thread.
///
/// The `invoke` methods differ in how the caller waits for JavaScript:
/// - ``invokeDetached(arguments:)`` doesn't wait, and reports a JavaScript error with
///   ``reportError(_:)``;
/// - `invokeBlocking` blocks the calling thread until JavaScript returns;
/// - `invokeAsync` suspends instead, and also awaits a promise that the function returns.
///
/// On the JavaScript thread, every method runs the function inline. Once the runtime is gone, they
/// throw ``RuntimeLostError``.
public final class JavaScriptCallback: Sendable {
  /// Carries a closure argument to the JavaScript thread, where it is encoded. The argument's type
  /// may not be `Sendable`, so the box is `@unchecked Sendable`: a blocking or async call keeps the
  /// caller waiting until the argument is encoded, but a detached call doesn't.
  public struct Argument<Value>: @unchecked Sendable {
    public let value: Value

    public init(_ value: consuming Value) {
      self.value = value
    }
  }

  /// Thrown by a call that can't reach JavaScript, because the runtime was destroyed (for example
  /// on reload) or it can no longer schedule work on the JavaScript thread.
  public struct RuntimeLostError: Error, CustomStringConvertible {
    public init() {}

    public var description: String {
      return
        "The JavaScript function can't be called because its runtime is gone, which happens when the app reloads. Don't keep JavaScript callbacks past the lifetime of the runtime that created them."
    }
  }

  /// Owns the JavaScript function. Registered with the runtime's ``LongLivedObjectCollection`` so
  /// the function is released on the JavaScript thread: by the callback's `deinit` normally, or by
  /// the teardown sweep when the callback outlives the runtime. It is a separate object because the
  /// collection holds it strongly, and the callback itself has to be free to deinitialize.
  @JavaScriptActor
  private final class LongLivedState: LongLivedObject {
    // Stored as `JavaScriptValue`, a `Copyable` reference type, so it can be read back through
    // `JavaScriptRef.withValue` without a copy of a non-copyable value.
    let function = JavaScriptValue.Ref()

    func allowRelease() {
      function.release()
    }
  }

  // The callback never refers to the runtime weakly or reads it off the JavaScript thread. It
  // retains the scheduler to hop threads, and reads the runtime through the handle only in work
  // that runs on the JavaScript thread, where the runtime is also destroyed.
  private let runtimeHandle: JavaScriptRuntimeHandle
  // The C++ scheduler isn't marked `Sendable`, but its fields are immutable and its reference count
  // is atomic, so scheduling from any thread is safe.
  nonisolated(unsafe) private let scheduler: expo.RuntimeScheduler
  private let javaScriptThreadID: UInt64
  private let longLivedObjects: LongLivedObjectCollection
  private let longLivedState: LongLivedState

  /// Wraps the function in `value`. Throws when the value isn't a function.
  @JavaScriptActor
  public init(_ value: borrowing JavaScriptUnownedValue, in runtime: JavaScriptRuntime) throws {
    let function = value.copied(in: runtime)
    guard function.isFunction() else {
      throw JavaScriptValue.TypeError(type: JavaScriptFunction.self)
    }
    // A callback is created while decoding a call's arguments, so this is the JavaScript thread.
    var threadID: UInt64 = 0
    pthread_threadid_np(nil, &threadID)

    self.runtimeHandle = runtime.handle
    self.scheduler = runtime.scheduler
    self.javaScriptThreadID = threadID
    self.longLivedObjects = runtime.longLivedObjects
    self.longLivedState = LongLivedState()

    longLivedState.function.reset(function)
    longLivedObjects.add(longLivedState)
  }

  /// Wraps the function in `value`, or returns `nil` when the value is `undefined` or `null`. Throws
  /// for any other value that isn't a function.
  @JavaScriptActor
  public static func decodeIfPresent(_ value: borrowing JavaScriptUnownedValue, in runtime: JavaScriptRuntime) throws
    -> JavaScriptCallback?
  {
    if value.isUndefined() || value.isNull() {
      return nil
    }
    return try JavaScriptCallback(value, in: runtime)
  }

  deinit {
    // The function can only be released on the JavaScript thread. If the runtime is already gone,
    // its teardown sweep has released it, and a dropped task leaves nothing to do either.
    let runtimeHandle = runtimeHandle
    let longLivedObjects = longLivedObjects
    let longLivedState = longLivedState
    scheduler.scheduleTask(.NormalPriority) {
      guard runtimeHandle.isAlive else {
        return
      }
      JavaScriptActor.assumeIsolated {
        longLivedObjects.remove(longLivedState)
        longLivedState.allowRelease()
      }
    }
  }

  // MARK: - Calling

  /// Calls the function without waiting for it. Runs inline on the JavaScript thread, and schedules
  /// the call from any other thread. A JavaScript error, or a lost runtime, is reported with
  /// ``reportError(_:)`` rather than thrown.
  public func invokeDetached(arguments: sending @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue])
  {
    nonisolated(unsafe) let arguments = arguments
    runOnJavaScriptThread { runtime in
      do {
        _ = try self.call(arguments, in: runtime)
      } catch {
        self.report(error, in: runtime)
      }
    }
  }

  /// Calls the function and blocks the calling thread until it returns. Rethrows a JavaScript error.
  public func invokeBlocking(arguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue])
    throws
  {
    nonisolated(unsafe) let arguments = arguments
    try runBlocking { runtime in
      _ = try self.call(arguments, in: runtime)
    }
  }

  /// Calls the function, blocks the calling thread until it returns, and decodes its result.
  /// Rethrows a JavaScript error and a decoding error.
  public func invokeBlocking<R>(
    arguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue],
    decodeResult: @escaping @JavaScriptActor (JavaScriptValue, JavaScriptRuntime) throws -> R
  ) throws -> sending R {
    // The closures are escaping because the scheduler may release its task, and what it captures,
    // after this call has already returned.
    nonisolated(unsafe) let arguments = arguments
    nonisolated(unsafe) let decodeResult = decodeResult
    let result = try runBlocking { runtime in
      Argument(try decodeResult(try self.call(arguments, in: runtime), runtime))
    }
    return result.value
  }

  /// Calls the function and suspends until it returns. When it returns a promise, also awaits the
  /// promise. Rethrows a JavaScript error and a promise rejection.
  public func invokeAsync(arguments: sending @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue])
    async throws
  {
    _ = try await invokeAsync(arguments: arguments) { _, _ in () }
  }

  /// Calls the function, suspends until it returns, and decodes its result. When it returns a
  /// promise, decodes the value the promise resolves with. Rethrows a JavaScript error, a promise
  /// rejection and a decoding error.
  public func invokeAsync<R>(
    arguments: sending @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue],
    decodeResult: sending @escaping @JavaScriptActor (JavaScriptValue, JavaScriptRuntime) throws -> R
  ) async throws -> sending R {
    nonisolated(unsafe) let arguments = arguments
    nonisolated(unsafe) let decodeResult = decodeResult

    let outcome = try await runAsync { runtime -> Argument<AsyncOutcome<R>> in
      let result = try self.call(arguments, in: runtime)
      guard Self.isThenable(result) else {
        return Argument(.value(try decodeResult(result, runtime)))
      }
      return Argument(.promise(JavaScriptPromise.Ref(try JavaScriptPromise(runtime, result.getObject()))))
    }

    switch outcome.value {
    case .value(let value):
      return value
    case .promise(let promiseRef):
      let promise: JavaScriptPromise = try promiseRef.take()
      let settled = try await promise.await()
      // The await can resume on any thread, so the decode hops back to the JavaScript thread.
      nonisolated(unsafe) let settledValue = settled
      let decoded = try await runAsync { runtime in
        Argument(try decodeResult(settledValue, runtime))
      }
      return decoded.value
    }
  }

  /// Reports an error from a closure that can't throw it. The error goes to React Native's global
  /// `ErrorUtils.reportError` on the JavaScript thread, as an uncaught JavaScript exception would.
  /// Without `ErrorUtils`, as in a standalone runtime, the error is printed instead.
  public func reportError(_ error: any Error) {
    runOnJavaScriptThread { runtime in
      self.report(error, in: runtime)
    }
  }

  // MARK: - JavaScript thread

  private enum AsyncOutcome<R> {
    case value(R)
    case promise(JavaScriptPromise.Ref)
  }

  /// Encodes the arguments and calls the function. Throws ``RuntimeLostError`` when the teardown
  /// sweep already released the function.
  @JavaScriptActor
  private func call(
    _ arguments: @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue],
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptValue {
    guard let function = longLivedState.function.withValue({ $0 }) else {
      throw RuntimeLostError()
    }
    let values = try arguments(runtime)
    if values.isEmpty {
      return try function.getFunction().call()
    }
    return try function.getFunction().call(arguments: JavaScriptValuesBuffer.copying(in: runtime, values: values))
  }

  @JavaScriptActor
  private static func isThenable(_ value: JavaScriptValue) -> Bool {
    guard value.isObject() else {
      return false
    }
    let then = value.getObject().getProperty("then")
    return then.isObject() && then.isFunction()
  }

  @JavaScriptActor
  private func report(_ error: any Error, in runtime: JavaScriptRuntime) {
    // `isFunction()` needs the value to be an object, so each check tests that first.
    let errorUtils = runtime.global().getProperty("ErrorUtils")
    guard errorUtils.isObject() else {
      print("Error in a JavaScript callback: \(error)")
      return
    }
    let reportError = errorUtils.getObject().getProperty("reportError")
    guard reportError.isObject(), reportError.isFunction() else {
      print("Error in a JavaScript callback: \(error)")
      return
    }
    // A JavaScript exception reaches Swift as a `CppError` that keeps only the message, so it is
    // reported as a new `Error` with that message.
    let jsError =
      if let cppError = error as? expo.CppError {
        JavaScriptError(runtime, message: cppError.message)
      } else {
        JavaScriptError.from(error, in: runtime)
      }
    do {
      try reportError.getFunction().call(this: errorUtils.getObject(), arguments: jsError.toValue())
    } catch {
      print("Error in a JavaScript callback: \(error)")
    }
  }

  // MARK: - Thread hops

  private var isOnJavaScriptThread: Bool {
    var current: UInt64 = 0
    pthread_threadid_np(nil, &current)
    return current == javaScriptThreadID
  }

  /// Runs `body` with the runtime, inline on the JavaScript thread or scheduled from any other.
  /// A lost runtime is reported with ``reportError(_:)``, which can't reach JavaScript either, so it
  /// prints the error.
  private func runOnJavaScriptThread(_ body: sending @escaping @JavaScriptActor (JavaScriptRuntime) -> Void) {
    nonisolated(unsafe) let body = body
    let task: @convention(block) () -> Void = {
      guard let runtime = self.runtimeHandle.runtime else {
        print("Error in a JavaScript callback: \(RuntimeLostError())")
        return
      }
      JavaScriptActor.assumeIsolated {
        body(runtime)
      }
    }
    if isOnJavaScriptThread {
      task()
    } else {
      scheduler.scheduleTask(.NormalPriority, task)
    }
  }

  /// Runs `body` on the JavaScript thread and blocks the calling thread until it returns. Off the
  /// JavaScript thread, it pumps the caller's run loop while it waits, like the runtime's
  /// `execute`, and throws ``RuntimeLostError`` when the scheduler drops the task instead of
  /// running it.
  private func runBlocking<R>(_ body: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> sending R) throws
    -> sending R
  {
    if isOnJavaScriptThread {
      return try JavaScriptActor.assumeIsolated {
        try body(try self.liveRuntime())
      }
    }
    let completion = BlockingCompletion<R>()
    nonisolated(unsafe) let body = body
    // The guardian is created in the capture list so the task is its only owner: a local would keep
    // it alive while this function waits, and a dropped task could never finish the wait.
    scheduler.scheduleTask(.ImmediatePriority) {
      [guardian = TaskGuardian { completion.finish(.failure(RuntimeLostError())) }] in
      guardian.disarm()
      let result = Result {
        try JavaScriptActor.assumeIsolated {
          try body(try self.liveRuntime())
        }
      }
      completion.finish(result)
    }
    return try completion.wait()
  }

  /// Runs `body` on the JavaScript thread and suspends until it returns. Throws
  /// ``RuntimeLostError`` when the scheduler drops the task instead of running it.
  private func runAsync<R>(_ body: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> sending R) async throws
    -> sending R
  {
    if isOnJavaScriptThread {
      return try JavaScriptActor.assumeIsolated {
        try body(try self.liveRuntime())
      }
    }
    nonisolated(unsafe) let body = body
    let result: Argument<Result<R, any Error>> = await withUnsafeContinuation { continuation in
      let resumer = ContinuationResumer(continuation)
      // As in `runBlocking`, the task is the guardian's only owner.
      scheduler.scheduleTask(.ImmediatePriority) {
        [guardian = TaskGuardian { resumer.resume(Argument(.failure(RuntimeLostError()))) }] in
        guardian.disarm()
        let result = Result {
          try JavaScriptActor.assumeIsolated {
            try body(try self.liveRuntime())
          }
        }
        resumer.resume(Argument(result))
      }
    }
    return try result.value.get()
  }

  /// The runtime, read on the JavaScript thread. Throws ``RuntimeLostError`` once it's gone.
  @JavaScriptActor
  private func liveRuntime() throws -> JavaScriptRuntime {
    guard let runtime = runtimeHandle.runtime else {
      throw RuntimeLostError()
    }
    return runtime
  }
}

// MARK: - Completion helpers

/// Runs its action when it's deallocated without being disarmed. Captured only by a task passed to
/// the scheduler: the scheduler releases a task it drops without running, and that release is how
/// the waiting caller learns the task will never run.
private final class TaskGuardian: @unchecked Sendable {
  private let lock = NSLock()
  private var action: (@Sendable () -> Void)?

  init(_ action: @escaping @Sendable () -> Void) {
    self.action = action
  }

  func disarm() {
    lock.withLock {
      action = nil
    }
  }

  deinit {
    let action = lock.withLock { self.action }
    action?()
  }
}

/// The result a blocking call waits for. The first `finish` wins: a task that ran finishes before
/// it's released, so its guardian's `finish` comes second and is ignored.
private final class BlockingCompletion<R>: @unchecked Sendable {
  private let lock = NSLock()
  private var result: Result<R, any Error>?
  private let callerRunLoop = CFRunLoopGetCurrent()

  func finish(_ result: sending Result<R, any Error>) {
    let isFirst = lock.withLock {
      guard self.result == nil else {
        return false
      }
      self.result = result
      return true
    }
    guard isFirst else {
      return
    }
    // Wake the caller's run loop so its wait returns immediately instead of at the timeout.
    CFRunLoopPerformBlock(callerRunLoop, CFRunLoopMode.commonModes.rawValue) {}
    CFRunLoopWakeUp(callerRunLoop)
  }

  /// Pumps the caller's run loop until the result arrives, so the run loop keeps handling other
  /// events in the meantime. The 100ms timeout is a backstop in case a wakeup is missed.
  func wait() throws -> sending R {
    while true {
      if let result = lock.withLock({ self.result }) {
        nonisolated(unsafe) let result = result
        return try result.get()
      }
      CFRunLoopRunInMode(.commonModes, 0.1, false)
    }
  }
}

/// Resumes a continuation once. Both the task and its guardian may try to resume it; only the
/// first succeeds.
private final class ContinuationResumer<T>: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: UnsafeContinuation<T, Never>?

  init(_ continuation: UnsafeContinuation<T, Never>) {
    self.continuation = continuation
  }

  func resume(_ value: sending T) {
    let continuation = lock.withLock {
      defer { self.continuation = nil }
      return self.continuation
    }
    continuation?.resume(returning: value)
  }
}
