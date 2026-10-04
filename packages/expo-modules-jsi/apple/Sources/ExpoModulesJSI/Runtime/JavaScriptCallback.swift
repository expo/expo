// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx

/// A JavaScript function that native code can keep and call later, from any thread.
///
/// Bindings generated for a `@JS` function create one for each closure argument. Each call runs on
/// the JavaScript thread, inline when already there:
/// - ``invokeDetached(arguments:)`` doesn't wait, and reports a JavaScript error with
///   ``reportError(_:)``;
/// - `invokeBlocking` blocks the calling thread until JavaScript returns;
/// - `invokeAsync` suspends instead, and also awaits a returned promise.
///
/// Once the runtime is gone, the calls throw ``RuntimeLostError``.
public final class JavaScriptCallback: Sendable {
  /// Carries a closure argument to the JavaScript thread, where it is encoded. The argument may not
  /// be `Sendable`, hence `@unchecked Sendable`.
  public struct Argument<Value>: @unchecked Sendable {
    public let value: Value

    public init(_ value: consuming Value) {
      self.value = value
    }
  }

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
    let function = JavaScriptValue.Ref()

    func allowRelease() {
      function.release()
    }
  }

  private weak let runtime: JavaScriptRuntime?
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
  private init(_ function: JavaScriptValue, in runtime: borrowing JavaScriptRuntime) {
    self.runtime = copy runtime
    self.longLivedState = LongLivedState()
    longLivedState.function.reset(function)
    runtime.longLivedObjects.add(longLivedState)
  }

  deinit {
    // Without a runtime, the teardown sweep has already released the function.
    guard let runtime else {
      return
    }
    // Capture the collection, not the runtime, so the scheduled task doesn't keep the runtime alive.
    let longLivedObjects = runtime.longLivedObjects
    runtime.schedule { [longLivedState] in
      longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  // MARK: - Calling

  /// Calls the function without waiting for it. A JavaScript error is reported with
  /// ``reportError(_:)``.
  public func invokeDetached(
    arguments: sending @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue]
  ) {
    guard let runtime else {
      print("Error in a JavaScript callback: \(RuntimeLostError())")
      return
    }
    nonisolated(unsafe) let arguments = arguments
    runtime.runOrSchedule {
      do {
        _ = try self.call(arguments, in: runtime)
      } catch {
        self.report(error, in: runtime)
      }
    }
  }

  /// Calls the function and blocks the calling thread until it returns.
  public func invokeBlocking(arguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue])
    throws
  {
    let runtime = try liveRuntime()
    nonisolated(unsafe) let arguments = arguments
    try runtime.execute {
      _ = try self.call(arguments, in: runtime)
    }
  }

  /// Calls the function, blocks the calling thread until it returns, and decodes its result.
  public func invokeBlocking<R>(
    arguments: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue],
    decodeResult: @escaping @JavaScriptActor (JavaScriptValue, JavaScriptRuntime) throws -> R
  ) throws -> sending R {
    let runtime = try liveRuntime()
    nonisolated(unsafe) let arguments = arguments
    nonisolated(unsafe) let decodeResult = decodeResult
    // `execute` requires a `Sendable` result, so the decoded value travels in an `Argument` box.
    let result = try runtime.execute {
      Argument(try decodeResult(try self.call(arguments, in: runtime), runtime))
    }
    return result.value
  }

  /// Calls the function and suspends until it returns, awaiting a returned promise.
  public func invokeAsync(arguments: sending @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue])
    async throws
  {
    _ = try await invokeAsync(arguments: arguments) { _, _ in () }
  }

  /// Calls the function, suspends until it returns, and decodes its result. When the function returns
  /// a promise, decodes the value the promise resolves with.
  public func invokeAsync<R>(
    arguments: sending @escaping @JavaScriptActor (JavaScriptRuntime) throws -> [JavaScriptValue],
    decodeResult: sending @escaping @JavaScriptActor (JavaScriptValue, JavaScriptRuntime) throws -> R
  ) async throws -> sending R {
    let runtime = try liveRuntime()
    nonisolated(unsafe) let arguments = arguments
    nonisolated(unsafe) let decodeResult = decodeResult

    let outcome = try await runtime.execute { () throws -> Argument<AsyncOutcome<R>> in
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
      nonisolated(unsafe) let settled = try await promise.await()
      // The await may resume on another thread, so decode back on the JavaScript thread.
      let decoded = try await runtime.execute {
        Argument(try decodeResult(settled, runtime))
      }
      return decoded.value
    }
  }

  /// Reports an error from a closure that can't throw it: to React Native's `ErrorUtils.reportError`,
  /// or to `console.error` without it, or prints it without a console.
  public func reportError(_ error: any Error) {
    guard let runtime else {
      print("Error in a JavaScript callback: \(error)")
      return
    }
    runtime.runOrSchedule {
      self.report(error, in: runtime)
    }
  }

  // MARK: - Private

  private enum AsyncOutcome<R> {
    case value(R)
    case promise(JavaScriptPromise.Ref)
  }

  private func liveRuntime() throws -> JavaScriptRuntime {
    guard let runtime else {
      throw RuntimeLostError()
    }
    return runtime
  }

  /// Encodes the arguments and calls the function. Throws ``RuntimeLostError`` after the teardown
  /// sweep released it.
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
    argument: JavaScriptValue
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
      try method.getFunction().call(this: object.getObject(), arguments: argument)
      return true
    } catch {
      return false
    }
  }
}
