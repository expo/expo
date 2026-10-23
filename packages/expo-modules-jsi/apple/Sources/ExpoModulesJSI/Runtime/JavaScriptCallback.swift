// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx

/// A JavaScript function that native code can keep and call later, from any thread.
///
/// Bindings generated for a `@JS` function create one for each closure argument. Each `invoke`
/// method encodes the arguments, calls the function and decodes the result on the JavaScript thread,
/// inline when already there:
/// - `invokeDetached` doesn't wait, and reports a JavaScript error with ``reportError(_:)``;
/// - `invokeBlocking` blocks the calling thread until JavaScript returns;
/// - `invokeAsync` suspends instead, and also awaits a returned promise.
///
/// Once the runtime is gone, the calls throw ``RuntimeLostError``.
public final class JavaScriptCallback: Sendable {
  /// Thrown by a call made after the runtime is gone, for example after a reload.
  public struct RuntimeLostError: Error, CustomStringConvertible {
    public init() {}

    public var description: String {
      return
        "The JavaScript function can't be called because its runtime is gone, which happens when the app reloads. Don't keep JavaScript callbacks past the lifetime of the runtime that created them."
    }
  }

  /// Owns the function. Registered with the runtime's ``LongLivedObjectCollection``, so it's released
  /// on the JavaScript thread, by `deinit` or by the teardown sweep.
  @JavaScriptActor
  private final class LongLivedState: LongLivedObject {
    var function: JavaScriptFunction?

    func allowRelease() {
      function = nil
    }
  }

  /// Held instead of the runtime, because the callback is called and released from any thread.
  private let scheduler: JavaScriptRuntime.Scheduler
  private let longLivedState: LongLivedState

  /// Wraps the function in `value`. Throws when the value isn't a function.
  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptCallback
  {
    let function = value.copied(in: runtime)
    guard function.isFunction() else {
      throw JavaScriptValue.TypeError(type: JavaScriptFunction.self)
    }
    return JavaScriptCallback(function, in: runtime)
  }

  /// Wraps the function in `value`, or returns `nil` when the value is `undefined` or `null`.
  @JavaScriptActor
  public static func decodeIfPresent(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptCallback? {
    if value.isUndefined() || value.isNull() {
      return nil
    }
    return try decode(value, in: runtime)
  }

  @JavaScriptActor
  private init(_ function: consuming JavaScriptValue, in runtime: borrowing JavaScriptRuntime) {
    self.scheduler = runtime.scheduler
    self.longLivedState = LongLivedState()
    longLivedState.function = function.getFunction()
    runtime.longLivedObjects.add(longLivedState)
  }

  deinit {
    // Without a runtime, the teardown sweep has already released the function.
    guard scheduler.mayBeAlive else {
      return
    }
    scheduler.schedule { [longLivedState] runtime in
      runtime.longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  // MARK: - Calling

  // The generic methods are inlinable so the encodes and decodes specialize in the caller's module.
  // They carry the arguments to the JavaScript thread in an unchecked box, because the argument types
  // may not be `Sendable`. A blocking or async call waits until the arguments are encoded; a detached
  // call doesn't.

  /// Calls the function with `arguments` without waiting for it. A JavaScript error is reported with
  /// ``reportError(_:)``. On the JavaScript thread, the function runs before this method returns.
  @inlinable
  public func invokeDetached<each A: JavaScriptEncodable>(_ arguments: repeat each A) {
    let box = UncheckedSendableBox((repeat each arguments))
    runDetached { runtime in
      let arguments = box.value
      return try Self.encodeArguments(repeat each arguments, in: runtime)
    }
  }

  /// Calls the function with `arguments` and blocks the calling thread until it returns.
  /// Not available in async contexts to prevent blocking the cooperative thread pool. Use
  /// ``invokeAsync(_:)`` there.
  @available(*, noasync)
  @inlinable
  public func invokeBlocking<each A: JavaScriptEncodable>(_ arguments: repeat each A) throws {
    let box = UncheckedSendableBox((repeat each arguments))
    let _: UncheckedSendableBox<Void> = try runBlocking { runtime in
      let arguments = box.value
      return try Self.encodeArguments(repeat each arguments, in: runtime)
    } decodeResult: { _, _ in
      UncheckedSendableBox(())
    }
  }

  /// Calls the function with `arguments`, blocks the calling thread until it returns, and decodes
  /// its result. Not available in async contexts to prevent blocking the cooperative thread pool.
  /// Use ``invokeAsync(_:returning:)`` there.
  @available(*, noasync)
  @inlinable
  public func invokeBlocking<each A: JavaScriptEncodable, R: JavaScriptDecodable>(
    _ arguments: repeat each A,
    returning _: R.Type
  ) throws -> sending R {
    let box = UncheckedSendableBox((repeat each arguments))
    let result = try runBlocking { runtime in
      let arguments = box.value
      return try Self.encodeArguments(repeat each arguments, in: runtime)
    } decodeResult: { result, runtime in
      UncheckedSendableBox(try R.decode(result, in: runtime))
    }
    return result.value
  }

  /// Calls the function with `arguments` and suspends until it returns, awaiting a returned promise.
  @inlinable
  public func invokeAsync<each A: JavaScriptEncodable>(_ arguments: repeat each A) async throws {
    let box = UncheckedSendableBox((repeat each arguments))
    let _: UncheckedSendableBox<Void> = try await runAsync { runtime in
      let arguments = box.value
      return try Self.encodeArguments(repeat each arguments, in: runtime)
    } decodeResult: { _, _ in
      UncheckedSendableBox(())
    }
  }

  /// Calls the function with `arguments`, suspends until it returns, and decodes its result. When
  /// the function returns a promise, decodes the value the promise resolves with.
  @inlinable
  public func invokeAsync<each A: JavaScriptEncodable, R: JavaScriptDecodable>(
    _ arguments: repeat each A,
    returning _: R.Type
  ) async throws -> sending R {
    let box = UncheckedSendableBox((repeat each arguments))
    let result = try await runAsync { runtime in
      let arguments = box.value
      return try Self.encodeArguments(repeat each arguments, in: runtime)
    } decodeResult: { result, runtime in
      UncheckedSendableBox(try R.decode(result, in: runtime))
    }
    return result.value
  }

  /// Encodes the arguments of a call on the JavaScript thread, moving each encoded value straight into
  /// the arguments buffer.
  @inlinable
  @JavaScriptActor
  internal static func encodeArguments<each A: JavaScriptEncodable>(
    _ arguments: repeat each A,
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptValuesBuffer {
    var count = 0
    for _ in repeat each arguments {
      count += 1
    }
    // Filled with `undefined` first, so the buffer stays valid to destroy when an encode throws.
    let buffer = JavaScriptValuesBuffer.allocateUndefined(in: runtime, count: count)
    var index = 0
    repeat try encodeArgument(each arguments, into: buffer, at: &index, in: runtime)
    return buffer
  }

  @inlinable
  @JavaScriptActor
  internal static func encodeArgument<A: JavaScriptEncodable>(
    _ argument: A,
    into buffer: borrowing JavaScriptValuesBuffer,
    at index: inout Int,
    in runtime: JavaScriptRuntime
  ) throws {
    buffer.emplace(try A.encode(argument, in: runtime), at: index)
    index += 1
  }

  /// Reports an error from a closure that can't throw it: to React Native's `ErrorUtils.reportError`,
  /// or to `console.error` without it, or prints it without a console.
  public func reportError(_ error: any Error) {
    guard scheduler.mayBeAlive else {
      print("Error in a JavaScript callback: \(error)")
      return
    }
    scheduler.runOrSchedule { runtime in
      self.report(error, in: runtime)
    }
  }

  // MARK: - Running on the JavaScript thread

  // The non-generic part of the calls, compiled in the framework. `encodeArguments` and
  // `decodeResult` run on the JavaScript thread.

  @usableFromInline
  internal func runDetached(
    encodeArguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> JavaScriptValuesBuffer
  ) {
    guard scheduler.mayBeAlive else {
      print("Error in a JavaScript callback: \(RuntimeLostError())")
      return
    }
    scheduler.runOrSchedule { runtime in
      do {
        _ = try self.call(encodeArguments, in: runtime)
      } catch {
        self.report(error, in: runtime)
      }
    }
  }

  @usableFromInline
  internal func runBlocking<R: Sendable>(
    encodeArguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> JavaScriptValuesBuffer,
    decodeResult: @escaping @JavaScriptActor (borrowing JavaScriptValue, JavaScriptRuntime) throws -> R
  ) throws -> R {
    return try scheduler.execute { runtime in
      try decodeResult(try self.call(encodeArguments, in: runtime), runtime)
    }
  }

  @usableFromInline
  internal func runAsync<R: Sendable>(
    encodeArguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> JavaScriptValuesBuffer,
    decodeResult: @escaping @JavaScriptActor (borrowing JavaScriptValue, JavaScriptRuntime) throws -> R
  ) async throws -> R {
    let outcome = try await callForAsync(encodeArguments: encodeArguments, decodeResult: decodeResult)
    switch outcome.value {
    case .value(let value):
      return value
    case .promise(let promiseRef):
      let promise: JavaScriptPromise = try promiseRef.take()
      // Wrapped in a ref, because the closure below escapes and can't capture a non-copyable value.
      let settled = try await promise.await().ref()
      // The await may resume on another thread, so decode back on the JavaScript thread.
      return try await scheduler.execute { runtime in
        let value: JavaScriptValue = try settled.take()
        return try decodeResult(value, runtime)
      }
    }
  }

  /// Calls the function and decodes a result that isn't a promise.
  private func callForAsync<R: Sendable>(
    encodeArguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> JavaScriptValuesBuffer,
    decodeResult: @escaping @JavaScriptActor (borrowing JavaScriptValue, JavaScriptRuntime) throws -> R
  ) async throws -> UncheckedSendableBox<AsyncOutcome<R>> {
    return try await scheduler.execute { runtime throws -> UncheckedSendableBox<AsyncOutcome<R>> in
      let result = try self.call(encodeArguments, in: runtime)
      guard result.isThenable() else {
        return UncheckedSendableBox(.value(try decodeResult(result, runtime)))
      }
      return UncheckedSendableBox(.promise(JavaScriptPromise.Ref(try JavaScriptPromise(runtime, result.getObject()))))
    }
  }

  private enum AsyncOutcome<R> {
    case value(R)
    case promise(JavaScriptPromise.Ref)
  }

  /// Encodes the arguments and calls the function. Throws ``RuntimeLostError`` after the teardown
  /// sweep released it.
  @JavaScriptActor
  private func call(
    _ encodeArguments: @JavaScriptActor (JavaScriptRuntime) throws -> JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptValue {
    // Borrowed rather than cloned out of the state: a clone allocates an engine handle on every call.
    switch longLivedState.function {
    case .some(let function):
      return try function.call(arguments: encodeArguments(runtime))
    case .none:
      throw RuntimeLostError()
    }
  }

  @JavaScriptActor
  private func report(_ error: any Error, in runtime: JavaScriptRuntime) {
    // A JavaScript exception arrives as a `CppError` with only its message.
    let jsError =
      if let cppError = error as? expo.CppError {
        JavaScriptError(runtime, message: cppError.message)
      } else {
        JavaScriptError.from(error, in: runtime)
      }
    let global = runtime.global()
    if Self.callGlobalMethod(global, object: "ErrorUtils", method: "reportError", argument: jsError.toValue()) {
      return
    }
    if Self.callGlobalMethod(global, object: "console", method: "error", argument: jsError.toValue()) {
      return
    }
    print("Error in a JavaScript callback: \(error)")
  }

  /// Calls `globalThis[object][method](argument)`. Returns `false` when either is missing or the call
  /// throws.
  @JavaScriptActor
  private static func callGlobalMethod(
    _ global: borrowing JavaScriptObject,
    object objectName: String,
    method methodName: String,
    argument: consuming JavaScriptValue
  ) -> Bool {
    // `isFunction()` requires an object, so check that first.
    let object = global.getProperty(objectName)
    guard object.isObject() else {
      return false
    }
    let method = object.getObject().getProperty(methodName)
    guard method.isObject(), method.isFunction() else {
      return false
    }
    do {
      try method.getFunction().call(this: object.getObject(), argument: argument)
      return true
    } catch {
      return false
    }
  }
}

/// Carries a value that may not be `Sendable` across threads. Used where the code that owns the
/// value waits for the other side, or doesn't use the value again.
@frozen
@usableFromInline
internal struct UncheckedSendableBox<Value>: @unchecked Sendable {
  @usableFromInline
  internal let value: Value

  @inlinable
  internal init(_ value: Value) {
    self.value = value
  }
}
